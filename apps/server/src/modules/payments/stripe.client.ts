import Stripe from 'stripe';

// Initialize Stripe client with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2022-11-15',
});

// TODO: Implement functions to interact with Stripe API, such as creating charges, handling subscriptions, etc.

export default stripe;