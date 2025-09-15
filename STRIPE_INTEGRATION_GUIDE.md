## Stripe Integration Guide (Account setup → Plan creation)

This guide walks you from creating a Stripe account to offering subscription plans in your existing stack (Express server in `server/` and Next.js client in `client/`). The flow uses Stripe Checkout for subscriptions, webhooks for lifecycle events, and keeps all code in JavaScript with axios on the client.

### 1) Create and configure your Stripe account

1. Create a Stripe account and activate it in the Dashboard.
2. Switch to Test mode in the Dashboard for development.
3. Copy these credentials from the Dashboard:
   - Secret key (server): e.g. `sk_test_...`
   - Publishable key (client): e.g. `pk_test_...`
   - You will also need a Webhook Signing Secret after you set up a webhook.

Useful links: [Stripe Dashboard](https://dashboard.stripe.com), [API Keys docs](https://docs.stripe.com/keys).

### 2) Install required packages

On the server (Express):

```bash
cd server
npm i stripe
```

On the client (Next.js):

```bash
cd client
npm i @stripe/stripe-js
```

Stripe CLI (optional but strongly recommended for local webhooks): on Windows, install via winget:

```powershell
winget install Stripe.StripeCLI
```

Docs: [Stripe CLI](https://docs.stripe.com/stripe-cli).

### 3) Add environment variables

Server (`server/.env`):

```bash
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret

# Optional if you want to reference price IDs from env
STRIPE_PRICE_MONTHLY=price_123...
STRIPE_PRICE_ANNUAL=price_456...
```

Client (`client/.env.local`):

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
```

Restart dev servers after adding env files so changes are picked up.

### 4) Initialize Stripe on the server

Create `server/services/stripe.js` (or a similar utility) to centralize initialization.

```js
// server/services/stripe.js
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

module.exports = stripe;
```

### 5) Create Products and Prices (Plans)

For subscriptions, Stripe uses Products (what you sell) and Prices (how much/how often). You can create them in the Dashboard or via API. Dashboard is simplest:

1. In the Dashboard, create a Product for your plan, e.g. “Pro”.
2. Add recurring Prices to that Product: one monthly (e.g. $9.99) and one annual (e.g. $99.00).
3. Copy each Price ID (e.g. `price_abc123`) for use in your server endpoint.

If you prefer API creation during setup:

```js
// One-time setup script example (run once)
const stripe = require('./services/stripe');

async function main() {
  const product = await stripe.products.create({ name: 'Pro' });
  const monthly = await stripe.prices.create({
    unit_amount: 999, // $9.99
    currency: 'usd',
    recurring: { interval: 'month' },
    product: product.id,
  });
  const annual = await stripe.prices.create({
    unit_amount: 9900, // $99.00
    currency: 'usd',
    recurring: { interval: 'year' },
    product: product.id,
  });
  console.log({ product: product.id, monthly: monthly.id, annual: annual.id });
}

main().catch(console.error);
```

### 6) Create a Checkout Session endpoint (subscription)

Add a new protected route to your payment router, e.g. `POST /payment/create-checkout-session`. It should:

1. Look up or create a Stripe Customer for the organization/admin user.
2. Create a Checkout Session in subscription mode with the chosen Price ID.
3. Include metadata so you can map Stripe events back to your DB (`organizationID`, `userId`).
4. Return `session.url` to the client for redirection.

Example controller method (adapt to `server/controllers/paymentController.js` or create a new controller file):

```js
// server/controllers/stripeSubscriptionController.js
const stripe = require('../services/stripe');
const Organization = require('../models/Organization');
const User = require('../models/User');

// Utility: fetch or create a Stripe customer and store id in your DB for reuse
async function getOrCreateCustomer({ organizationID, userId }) {
  const org = await Organization.findOne({ OrganizationID: organizationID });
  if (!org) throw new Error('Organization not found');

  if (org.stripeCustomerId) {
    return org.stripeCustomerId;
  }

  const admin = await User.findById(userId);
  const customer = await stripe.customers.create({
    email: admin?.email,
    metadata: { organizationID, userId },
  });

  org.stripeCustomerId = customer.id;
  await org.save();
  return customer.id;
}

exports.createCheckoutSession = async (req, res) => {
  try {
    const { organizationID, userId, priceId, successUrl, cancelUrl } = req.body;
    if (!organizationID || !userId || !priceId) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const customerId = await getOrCreateCustomer({ organizationID, userId });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || `${process.env.APP_BASE_URL}/payment?status=success`,
      cancel_url: cancelUrl || `${process.env.APP_BASE_URL}/payment?status=cancelled`,
      metadata: { organizationID, userId },
      // Recommended to reduce extra API calls on webhook
      subscription_data: {
        metadata: { organizationID, userId },
      },
    });

    return res.json({ success: true, url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('createCheckoutSession error', err);
    return res.status(500).json({ success: false, message: 'Failed to create checkout session' });
  }
};
```

Wire it in your router (e.g. `server/routes/paymentRoutes.js`):

```js
// const { protect } = require('../middleware/auth');
// const { createCheckoutSession } = require('../controllers/stripeSubscriptionController');
// router.post('/create-checkout-session', protect, createCheckoutSession);
```

Note: Do not accept or transmit raw card data through your server. Stripe Checkout (or Stripe Elements) securely handles payment details.

### 7) Client: call the endpoint and redirect to Checkout

Add a helper in `client/services/api.js` to request a Checkout Session and then redirect the browser.

```js
// client/services/api.js (excerpt)
export const paymentService = {
  createCheckoutSession: async ({ organizationID, userId, priceId, successUrl, cancelUrl }) => {
    const response = await api.post('/payment/create-checkout-session', {
      organizationID,
      userId,
      priceId,
      successUrl,
      cancelUrl,
    });
    return response.data; // { success, url, sessionId }
  },
};
```

Usage example in a component:

```js
import { paymentService } from '@/services/api';

async function startSubscription({ organizationID, userId, priceId }) {
  const { success, url } = await paymentService.createCheckoutSession({ organizationID, userId, priceId });
  if (success && url) {
    window.location.href = url; // Redirect user to Stripe Checkout
  }
}
```

If you prefer using `@stripe/stripe-js` and sessionId, you can load Stripe with `loadStripe(NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)` and call `redirectToCheckout({ sessionId })` instead of `window.location.href`.

### 8) Webhook to handle subscription lifecycle

Stripe notifies your server when payments succeed, fail, or when subscriptions renew/cancel. Implement a webhook endpoint, verify signatures, and update your DB accordingly. Map events to your existing `Payment`, `Organization`, and `User` models.

Create a route `POST /payment/webhook` that skips standard JSON parsing and uses the raw body for signature verification.

```js
// server/routes/paymentRoutes.js (excerpt)
// const express = require('express');
// const router = express.Router();
// const stripeWebhook = require('../webhooks/stripeWebhook');
// router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook.handle);
// module.exports = router;
```

Create the handler:

```js
// server/webhooks/stripeWebhook.js
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
        // Subscription may be available immediately or shortly after; fetch if needed
        const subscriptionId = session.subscription;
        const { organizationID, userId } = session.metadata || {};

        // Retrieve subscription for dates and amount
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
        const currentPeriodStart = new Date(subscription.current_period_start * 1000);
        const price = subscription.items.data[0].price;

        // Persist a Payment record for traceability
        const payment = new Payment({
          paymentId: `STRIPE_${subscription.id}`,
          amount: price.unit_amount / 100,
          currency: price.currency.toUpperCase(),
          status: 'completed',
          plan: price.recurring?.interval === 'year' ? 'annual' : 'monthly',
          billingCycle: price.recurring?.interval,
          paymentMethod: 'stripe',
          organizationID,
          userId,
          subscriptionStartDate: currentPeriodStart,
          subscriptionEndDate: currentPeriodEnd,
          autoRenew: true,
          transactionId: subscription.latest_invoice,
          gatewayResponse: { sessionId: session.id, subscriptionId: subscription.id },
        });
        await payment.save();

        // Mark organization and users as premium using your existing helpers
        // If you keep helpers from paymentController, call them here or inline equivalent logic
        const org = await Organization.findOne({ OrganizationID: organizationID });
        if (org) {
          org.isPremium = true;
          org.subscription = { plan: payment.plan, startDate: currentPeriodStart, endDate: currentPeriodEnd };
          await org.save();
        }
        const users = await User.find({ organizationID });
        await Promise.all(users.map(u => u.activatePremium(payment.plan, currentPeriodStart, currentPeriodEnd)));

        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.created':
      case 'invoice.paid':
      case 'customer.subscription.deleted': {
        // Optional: mirror changes, cancel premium when deleted, etc.
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
```

In your `server/app.js`, ensure the webhook route uses `express.raw()` and is registered before the JSON body parser, or mount it on a dedicated path that applies raw parsing only for the webhook route. When developing locally, run:

```bash
stripe listen --forward-to localhost:5000/payment/webhook
```

### 9) Mapping to your existing code

Your current `paymentController.js` simulates payments and toggles organization premium. Keep it for non-Stripe flows if needed, but route new subscription purchases through the Stripe endpoints. You can:

1. Add `POST /payment/create-checkout-session` and `POST /payment/webhook` alongside your existing routes in `server/routes/paymentRoutes.js`.
2. Reuse your `Payment`, `Organization`, and `User` models to persist Stripe outcomes as shown above.
3. Continue serving `GET /payment/organization/:organizationID` for consolidated subscription and history views; those will reflect Stripe-backed payments once webhook writes the DB rows.

### 10) Testing

1. Use test cards, e.g. 4242 4242 4242 4242 with any future expiry and any CVC. See the full list here: [Stripe test cards](https://docs.stripe.com/testing#cards).
2. In Test mode, run your client and server, start the Stripe CLI listener, subscribe using your app’s UI, and watch webhook logs.
3. Verify your DB has a `Payment` row and the organization/users are marked premium with the expected start/end dates.

### 11) Going to production

1. Create live mode Products and Prices in the Dashboard.
2. Replace env keys with live mode keys in your deployment environment.
3. Create a live webhook endpoint in the Dashboard and use the live `STRIPE_WEBHOOK_SECRET`.
4. Update success/cancel URLs to your production domain.

### 12) Common options and extensions

– Taxes: configure automatic tax in Stripe and enable it on Checkout Sessions if needed.  
– Trials and coupons: add `trial_period_days` on subscriptions, pass `discounts` to Checkout.  
– Metered billing: use usage-based Prices and report usage with the Subscriptions API.  
– Customer Portal: enable the hosted portal so customers can self-manage subscriptions: [Billing customer portal](https://docs.stripe.com/billing/subscriptions/customer-portal).

### 13) Security notes

– Never collect raw card numbers in your forms or send them to your server. Use Stripe Checkout or Stripe Elements.  
– Verify webhook signatures with `STRIPE_WEBHOOK_SECRET`.  
– Keep your secret key on the server only; the client uses only the publishable key.

---

You now have a clear path from Stripe account setup to live subscription plans integrated with your existing routes and models. If you want, we can implement the server routes and client calls next and wire them into your payment UI.


