const stripe = require('../services/stripe');
const Payment = require('../models/Payment');
const Organization = require('../models/Organization');
const User = require('../models/User');

exports.handle = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const subscriptionId = session.subscription;
        const { organizationID, userId } = session.metadata || {};

        if (!subscriptionId || !organizationID || !userId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
        const currentPeriodStart = new Date(subscription.current_period_start * 1000);
        const price = subscription.items?.data?.[0]?.price;
        const plan = price?.recurring?.interval === 'year' ? 'annual' : 'monthly';

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

        const org = await Organization.findOne({ OrganizationID: Number(organizationID) });
        if (org) {
          org.isPremium = true;
          org.subscription = { plan, startDate: currentPeriodStart, endDate: currentPeriodEnd };
          await org.save();
        }
        const users = await User.find({ organizationID: String(organizationID) });
        await Promise.all(users.map(u => u.activatePremium(plan, currentPeriodStart, currentPeriodEnd)));
        break;
      }
      case 'customer.subscription.deleted': {
        // Optional: deactivate premium here
        break;
      }
      default:
        break;
    }
    return res.json({ received: true });
  } catch (err) {
    console.error('Webhook handling error', err);
    return res.status(500).send('Webhook handler failed');
  }
};


