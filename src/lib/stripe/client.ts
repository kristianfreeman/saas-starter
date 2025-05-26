import Stripe from 'stripe';
import { env } from '@/lib/env';

// Server-side Stripe client
export const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
      typescript: true,
    })
  : null;

// Stripe configuration
export const stripeConfig = {
  publishableKey: env.STRIPE_PUBLISHABLE_KEY || '',
  webhookSecret: env.STRIPE_WEBHOOK_SECRET || '',
  customerPortal: {
    url: 'https://billing.stripe.com/p/login/test_28oaEY4MI9kH5Ww000', // Replace with your portal URL
  },
};

// Check if Stripe is configured
export const isStripeConfigured = (): boolean => {
  return !!(
    stripe &&
    stripeConfig.publishableKey &&
    stripeConfig.webhookSecret
  );
};