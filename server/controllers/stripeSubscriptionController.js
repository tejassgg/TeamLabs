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
      cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/settings?tab=subscription`,
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
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    const currentPeriodStart = new Date(subscription.current_period_start * 1000);
    const price = subscription.items?.data?.[0]?.price;
    const plan = price?.recurring?.interval === 'year' ? 'annual' : 'monthly';

    // Persist payment
    const Payment = require('../models/Payment');
    const payment = new Payment({
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

    // Update organization & users
    const org = await Organization.findOne({ OrganizationID: Number(organizationID) });
    if (org) {
      org.isPremium = true;
      org.subscription = { plan, startDate: currentPeriodStart, endDate: currentPeriodEnd };
      await org.save();
    }
    const users = await User.find({ organizationID: String(organizationID) });
    await Promise.all(users.map(u => u.activatePremium(plan, currentPeriodStart, currentPeriodEnd)));

    return res.json({ success: true });
  } catch (err) {
    console.error('confirmCheckoutSession error', err);
    return res.status(500).json({ success: false, message: 'Failed to confirm checkout session' });
  }
};

exports.listCustomerInvoices = async (req, res) => {
  try {
    const { organizationID } = req.params;
    const org = await Organization.findOne({ OrganizationID: Number(organizationID) });
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });
    if (!org.stripeCustomerId) return res.json({ success: true, data: [] });

    // Fetch latest 20 invoices and refunds in parallel
    const [invoicesResult, refundsResult] = await Promise.all([
      stripe.invoices.list({ customer: org.stripeCustomerId, limit: 20 }),
      stripe.refunds.list({ limit: 20 })
    ]);

    const invoices = invoicesResult.data;
    const refunds = refundsResult.data.filter(refund => 
      refund.charge && invoices.some(invoice => 
        invoice.charge === refund.charge || invoice.payment_intent === refund.payment_intent
      )
    );
    
    // Extract unique user IDs from subscription metadata and refund metadata
    const userIds = [...new Set([
      ...invoices
        .filter(invoice => invoice.subscription_details?.metadata?.userId)
        .map(invoice => invoice.subscription_details.metadata.userId),
      ...refunds
        .filter(refund => refund.metadata?.userId)
        .map(refund => refund.metadata.userId)
    ])];

    // Fetch user details for all unique user IDs
    const userDetailsMap = {};
    if (userIds.length > 0) {
      const User = require('../models/User');
      const users = await User.find({ _id: { $in: userIds } }).select('_id firstName lastName email profileImage role');
      
      users.forEach(user => {
        userDetailsMap[user._id.toString()] = {
          fullName: `${user.firstName} ${user.lastName}`,
          email: user.email,
          profileImage: user.profileImage,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        };
      });
    }

    // Enhance invoices with user details
    const enhancedInvoices = invoices.map(invoice => {
      const userId = invoice.subscription_details?.metadata?.userId;
      const userDetails = userId ? userDetailsMap[userId] : null;
      
      return {
        ...invoice,
        userDetails: userDetails || null,
        type: 'invoice'
      };
    });

    // Enhance refunds with user details
    const enhancedRefunds = refunds.map(refund => {
      const userId = refund.metadata?.userId;
      const userDetails = userId ? userDetailsMap[userId] : null;
      
      // Find the related invoice for additional context
      const relatedInvoice = invoices.find(invoice => 
        invoice.charge === refund.charge || invoice.payment_intent === refund.payment_intent
      );
      
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
      return_url: `${process.env.FRONTEND_URL}/settings?tab=subscription`,
    });

    return res.json({ success: true, url: session.url });
  } catch (err) {
    console.error('createBillingPortalSession error', err);
    return res.status(500).json({ success: false, message: 'Failed to create billing portal session' });
  }
};