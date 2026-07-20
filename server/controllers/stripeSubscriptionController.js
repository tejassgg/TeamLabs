const stripe = require('../services/stripe');
const Organization = require('../models/Organization');
const User = require('../models/User');

async function getOrCreateCustomer({ organizationID, userId }) {
  const org = await Organization.findOne({ OrganizationID: Number(organizationID) });
  if (!org) throw new Error('Organization not found');

  if (org.stripeCustomerId) {
    return org.stripeCustomerId;
  }

  const admin = await User.findById(userId);
  const customer = await stripe.customers.create({
    email: admin?.email,
    metadata: { organizationID: String(organizationID), userId: String(userId) },
  });

  org.stripeCustomerId = customer.id;
  await org.save();
  return customer.id;
}

exports.createCheckoutSession = async (req, res) => {
  try {
    const { organizationID, userId, priceId, plan, successUrl, cancelUrl } = req.body;
    if (!organizationID || !userId) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const envPriceId = plan === 'annual' ? process.env.STRIPE_PRICE_ANNUAL : process.env.STRIPE_PRICE_MONTHLY;
    const resolvedPriceId = priceId || envPriceId;
    if (!resolvedPriceId) {
      return res.status(400).json({ success: false, message: 'Missing priceId or STRIPE_PRICE env for plan' });
    }

    const customerId = await getOrCreateCustomer({ organizationID, userId });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: resolvedPriceId, quantity: 1 }],
      success_url: successUrl || `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/settings?tab=billing`,
      metadata: { organizationID: String(organizationID), userId: String(userId), plan: plan || null },
      subscription_data: {
        metadata: { organizationID: String(organizationID), userId: String(userId), plan: plan || null },
      },
    });

    return res.json({ success: true, url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('createCheckoutSession error', err);
    return res.status(500).json({ success: false, message: 'Failed to create checkout session' });
  }
};

exports.getCheckoutSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) return res.status(400).json({ success: false, message: 'Missing sessionId' });
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return res.json({ success: true, data: session });
  } catch (err) {
    console.error('getCheckoutSession error', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch checkout session' });
  }
};

exports.confirmCheckoutSession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ success: false, message: 'Missing sessionId' });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session || session.mode !== 'subscription') {
      return res.status(400).json({ success: false, message: 'Invalid session' });
    }

    const subscriptionId = session.subscription;
    const { organizationID, userId } = session.metadata || {};
    if (!subscriptionId || !organizationID || !userId) {
      return res.status(400).json({ success: false, message: 'Session metadata incomplete' });
    }

    // Idempotency: if we already recorded, return ok
    const existing = await require('../models/Payment').findOne({ paymentId: `STRIPE_${subscriptionId}` });
    if (existing) {
      return res.json({ success: true, alreadyProcessed: true });
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const price = subscription.items?.data?.[0]?.price;
    const plan = price?.recurring?.interval === 'year' ? 'annual' : 'monthly';

    const currentPeriodStart = (subscription.current_period_start && !isNaN(subscription.current_period_start))
      ? new Date(subscription.current_period_start * 1000)
      : new Date();

    const currentPeriodEnd = (subscription.current_period_end && !isNaN(subscription.current_period_end))
      ? new Date(subscription.current_period_end * 1000)
      : new Date(Date.now() + (plan === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000);

    // Persist payment & update organization/users with a single retry
    let dbSuccess = false;
    let attempt = 0;
    const maxAttempts = 2;
    let lastError = null;

    while (attempt < maxAttempts && !dbSuccess) {
      attempt++;
      try {
        const Payment = require('../models/Payment');
        
        let payment = await Payment.findOne({ paymentId: `STRIPE_${subscription.id}` });
        if (!payment) {
          payment = new Payment({
            paymentId: `STRIPE_${subscription.id}`,
            amount: (price?.unit_amount || 0) / 100,
            currency: (price?.currency || 'usd').toUpperCase(),
            status: 'completed',
            plan: plan,
            billingCycle: plan,
            paymentMethod: 'card',
            organizationID: String(organizationID),
            userId: userId,
            subscriptionStartDate: currentPeriodStart,
            subscriptionEndDate: currentPeriodEnd,
            autoRenew: true,
            transactionId: subscription.latest_invoice,
            gatewayResponse: { sessionId: session.id, subscriptionId: subscription.id },
          });
          await payment.save();
        }

        const org = await Organization.findOne({ OrganizationID: Number(organizationID) });
        if (org) {
          org.isPremium = true;
          org.subscription = { plan, startDate: currentPeriodStart, endDate: currentPeriodEnd };
          await org.save();
        }

        const users = await User.find({ organizationID: String(organizationID) });
        await Promise.all(users.map(u => u.activatePremium(plan, currentPeriodStart, currentPeriodEnd)));

        dbSuccess = true;

        // Send premium upgrade notification email to all organization members
        try {
          const { notifyPremiumUpgrade } = require('../services/emailService');
          notifyPremiumUpgrade(organizationID, userId).catch(err => {
            console.error('Error sending premium upgrade notification email:', err);
          });
        } catch (e) {
          console.error('Non-blocking premium upgrade notification email error:', e);
        }
      } catch (err) {
        lastError = err;
        console.error(`Database subscription activation attempt ${attempt} failed:`, err);
        if (attempt < maxAttempts) {
          // Wait 1 second before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    if (!dbSuccess) {
      console.error('Subscription activation failed after retry. Initiating Stripe refund and cancellation...');
      try {
        if (subscriptionId) {
          await stripe.subscriptions.cancel(subscriptionId);
          console.log(`Subscription ${subscriptionId} cancelled successfully.`);
        }

        if (subscription.latest_invoice) {
          const invoice = await stripe.invoices.retrieve(subscription.latest_invoice, {
            expand: ['payment_intent', 'charge', 'payments']
          });
          const paymentIntentId = getInvoicePaymentIntentId(invoice);
          const chargeId = getInvoiceChargeId(invoice);

          if (paymentIntentId) {
            const refund = await stripe.refunds.create({
              payment_intent: paymentIntentId,
              reason: 'requested_by_customer',
              metadata: {
                reason: 'Subscription activation failed',
                organizationID: String(organizationID),
                userId: userId
              }
            });
            console.log(`Refund initiated successfully for payment intent ${paymentIntentId}. Refund ID: ${refund.id}`);
          } else if (chargeId) {
            const refund = await stripe.refunds.create({
              charge: chargeId,
              reason: 'requested_by_customer',
              metadata: {
                reason: 'Subscription activation failed',
                organizationID: String(organizationID),
                userId: userId
              }
            });
            console.log(`Refund initiated successfully for charge ${chargeId}. Refund ID: ${refund.id}`);
          }
        }
      } catch (refundError) {
        console.error('Failed to cancel or refund Stripe subscription:', refundError);
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to activate subscription. A refund has been issued and the subscription has been cancelled.',
        error: lastError?.message
      });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('confirmCheckoutSession error', err);
    return res.status(500).json({ success: false, message: 'Failed to confirm checkout session' });
  }
};

const getInvoicePaymentIntentId = (invoice) => {
  if (!invoice) return null;
  if (invoice.payment_intent) {
    return typeof invoice.payment_intent === 'object' ? invoice.payment_intent.id : invoice.payment_intent;
  }
  if (invoice.payments && invoice.payments.data) {
    for (const p of invoice.payments.data) {
      if (p.payment && p.payment.payment_intent) {
        return typeof p.payment.payment_intent === 'object' ? p.payment.payment_intent.id : p.payment.payment_intent;
      }
    }
  }
  return null;
};

const getInvoiceChargeId = (invoice) => {
  if (!invoice) return null;
  if (invoice.charge) {
    return typeof invoice.charge === 'object' ? invoice.charge.id : invoice.charge;
  }
  if (invoice.payments && invoice.payments.data) {
    for (const p of invoice.payments.data) {
      if (p.payment && p.payment.charge) {
        return typeof p.payment.charge === 'object' ? p.payment.charge.id : p.payment.charge;
      }
    }
  }
  return null;
};

exports.listCustomerInvoices = async (req, res) => {
  try {
    const { organizationID } = req.params;
    const org = await Organization.findOne({ OrganizationID: Number(organizationID) });
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });
    if (!org.stripeCustomerId) return res.json({ success: true, data: [] });

    // Fetch latest 20 invoices and refunds in parallel
    const [invoicesResult, refundsResult] = await Promise.all([
      stripe.invoices.list({ 
        customer: org.stripeCustomerId, 
        limit: 20,
        expand: ['data.payment_intent', 'data.charge', 'data.payments']
      }),
      stripe.refunds.list({ limit: 20 })
    ]);

    const invoices = invoicesResult.data;
    const refunds = refundsResult.data.filter(refund => {
      const refundCharge = typeof refund.charge === 'object' ? refund.charge?.id : refund.charge;
      const refundPI = typeof refund.payment_intent === 'object' ? refund.payment_intent?.id : refund.payment_intent;
      
      return (refundCharge || refundPI) && invoices.some(invoice => {
        const invoiceCharge = getInvoiceChargeId(invoice);
        const invoicePI = getInvoicePaymentIntentId(invoice);
        
        return (refundCharge && invoiceCharge === refundCharge) || 
               (refundPI && invoicePI === refundPI);
      });
    });
    
    // Extract unique user IDs and customer emails from invoices and refunds
    const userIds = [...new Set([
      ...invoices
        .map(invoice => (invoice.parent?.subscription_details || invoice.subscription_details)?.metadata?.userId)
        .filter(Boolean),
      ...refunds
        .map(refund => refund.metadata?.userId)
        .filter(Boolean)
    ])];

    const emails = [...new Set(
      invoices.map(invoice => invoice.customer_email?.toLowerCase()).filter(Boolean)
    )];

    // Fetch user details for all unique user IDs or emails
    const userDetailsMap = {};
    if (userIds.length > 0 || emails.length > 0) {
      const User = require('../models/User');
      const users = await User.find({
        $or: [
          { _id: { $in: userIds } },
          { email: { $in: emails } }
        ]
      }).select('_id firstName lastName email profileImage role');
      
      users.forEach(user => {
        const details = {
          fullName: `${user.firstName} ${user.lastName}`,
          email: user.email,
          profileImage: user.profileImage,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        };
        userDetailsMap[user._id.toString()] = details;
        if (user.email) {
          userDetailsMap[user.email.toLowerCase()] = details;
        }
      });
    }

    // Enhance invoices with user details and refund info
    const enhancedInvoices = invoices.map(invoice => {
      const userId = (invoice.parent?.subscription_details || invoice.subscription_details)?.metadata?.userId;
      const userDetails = (userId ? userDetailsMap[userId] : null) || (invoice.customer_email ? userDetailsMap[invoice.customer_email.toLowerCase()] : null);
      
      // Match against refunds list to check if invoice has been refunded
      const invoiceCharge = getInvoiceChargeId(invoice);
      const invoicePI = getInvoicePaymentIntentId(invoice);
      const matchingRefunds = refundsResult.data.filter(refund => {
        const refundCharge = typeof refund.charge === 'object' ? refund.charge?.id : refund.charge;
        const refundPI = typeof refund.payment_intent === 'object' ? refund.payment_intent?.id : refund.payment_intent;

        return (refundCharge && refundCharge === invoiceCharge) || 
               (refundPI && refundPI === invoicePI);
      });

      const isRefunded = matchingRefunds.length > 0;
      const totalRefunded = matchingRefunds.reduce((sum, r) => sum + (r.amount || 0), 0);
      
      let status = invoice.status;
      if (isRefunded) {
        if (totalRefunded >= invoice.total) {
          status = 'refunded';
        } else {
          status = 'partially_refunded';
        }
      }

      return {
        ...invoice,
        userDetails: userDetails || null,
        type: 'invoice',
        status: status,
        isRefunded,
        totalRefunded
      };
    });

    // Enhance refunds with user details
    const enhancedRefunds = refunds.map(refund => {
      const userId = refund.metadata?.userId;
      const userDetails = userId ? userDetailsMap[userId] : null;
      
      // Find the related invoice for additional context
      const relatedInvoice = invoices.find(invoice => {
        const invoiceCharge = getInvoiceChargeId(invoice);
        const invoicePI = getInvoicePaymentIntentId(invoice);
        const refundCharge = typeof refund.charge === 'object' ? refund.charge?.id : refund.charge;
        const refundPI = typeof refund.payment_intent === 'object' ? refund.payment_intent?.id : refund.payment_intent;

        return (refundCharge && invoiceCharge === refundCharge) || 
               (refundPI && invoicePI === refundPI);
      });
      
      return {
        ...refund,
        userDetails: userDetails || null,
        type: 'refund',
        relatedInvoice: relatedInvoice || null
      };
    });

    // Combine and sort by creation date (newest first)
    const allTransactions = [...enhancedInvoices, ...enhancedRefunds]
      .sort((a, b) => (b.created || b.created_at) - (a.created || a.created_at));

    return res.json({ success: true, data: allTransactions });
  } catch (err) {
    console.error('listCustomerInvoices error', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
  }
};

exports.createBillingPortalSession = async (req, res) => {
  try {
    const { organizationID } = req.body;
    if (!organizationID) {
      return res.status(400).json({ success: false, message: 'Missing organizationID' });
    }

    const org = await Organization.findOne({ OrganizationID: Number(organizationID) });
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });

    let customerId = org.stripeCustomerId;
    if (!customerId) {
      // Create a placeholder user for email if needed
      const admin = await User.findOne({ _id: org.OwnerID });
      const customer = await stripe.customers.create({
        email: admin?.email,
        metadata: { organizationID: String(organizationID), userId: String(admin?._id || '') },
      });
      org.stripeCustomerId = customer.id;
      await org.save();
      customerId = customer.id;
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.FRONTEND_URL}/settings?tab=billing`,
    });

    return res.json({ success: true, url: session.url });
  } catch (err) {
    console.error('createBillingPortalSession error', err);
    return res.status(500).json({ success: false, message: 'Failed to create billing portal session' });
  }
};