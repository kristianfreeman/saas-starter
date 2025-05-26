export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  stripePriceId?: string;
  popular?: boolean;
}

// Define your subscription plans
export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for side projects',
    price: 9,
    currency: 'usd',
    interval: 'month',
    features: [
      'Up to 1,000 users',
      'Basic analytics',
      'Email support',
      'API access',
    ],
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID,
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For growing businesses',
    price: 29,
    currency: 'usd',
    interval: 'month',
    features: [
      'Unlimited users',
      'Advanced analytics',
      'Priority support',
      'Custom integrations',
      'Advanced API access',
      'Export data',
    ],
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations',
    price: 99,
    currency: 'usd',
    interval: 'month',
    features: [
      'Everything in Pro',
      'Dedicated support',
      'SLA guarantee',
      'Custom features',
      'On-premise option',
      'Advanced security',
    ],
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
  },
];

// Get a plan by ID
export function getPlanById(planId: string): SubscriptionPlan | undefined {
  return subscriptionPlans.find(plan => plan.id === planId);
}

// Get a plan by Stripe price ID
export function getPlanByPriceId(priceId: string): SubscriptionPlan | undefined {
  return subscriptionPlans.find(plan => plan.stripePriceId === priceId);
}

// Format price for display
export function formatPrice(price: number, currency: string = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(price);
}