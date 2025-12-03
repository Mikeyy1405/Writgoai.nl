import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

export const getStripe = (): Stripe => {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
    }
    
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-11-17.clover',
      typescript: true,
    });
  }
  
  return stripeInstance;
};

// For backward compatibility
export const stripe = new Proxy({} as Stripe, {
  get: (target, prop) => {
    const stripeClient = getStripe();
    return stripeClient[prop as keyof Stripe];
  }
});

export const getStripePublishableKey = (): string => {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
};
