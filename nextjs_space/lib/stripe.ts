
import Stripe from 'stripe';

function createStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    // Return a dummy client for build time
    console.warn('STRIPE_SECRET_KEY is not set - Stripe functionality will be limited');
    return new Stripe('sk_test_dummy_key_for_build', {
      apiVersion: '2025-10-29.clover',
      typescript: true,
    });
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-10-29.clover',
    typescript: true,
  });
}

export const stripe = createStripeClient();

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
