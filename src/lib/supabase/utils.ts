import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Profile, Subscription } from './types';

export class DatabaseError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// Profile utilities
export async function getProfile(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new DatabaseError(error.message, error.code);
  }

  return data;
}

export async function updateProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
  updates: Partial<Profile>
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new DatabaseError(error.message, error.code);
  }

  return data;
}

// Subscription utilities
export async function getSubscription(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new DatabaseError(error.message, error.code);
  }

  return data;
}

export async function updateSubscription(
  supabase: SupabaseClient<Database>,
  subscriptionId: string,
  updates: Partial<Subscription>
): Promise<Subscription> {
  const { data, error } = await supabase
    .from('subscriptions')
    .update(updates)
    .eq('id', subscriptionId)
    .select()
    .single();

  if (error) {
    throw new DatabaseError(error.message, error.code);
  }

  return data;
}

export async function getSubscriptionByStripeId(
  supabase: SupabaseClient<Database>,
  stripeSubscriptionId: string
): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new DatabaseError(error.message, error.code);
  }

  return data;
}

// Billing history utilities
export async function getBillingHistory(
  supabase: SupabaseClient<Database>,
  userId: string,
  limit = 10
) {
  const { data, error } = await supabase
    .from('billing_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new DatabaseError(error.message, error.code);
  }

  return data || [];
}

// Subscription plan utilities
export const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    features: [
      '1 user',
      '2 projects',
      'Community support',
      'Basic analytics',
    ],
  },
  starter: {
    name: 'Starter',
    price: 29,
    priceId: process.env.STRIPE_STARTER_PRICE_ID || '',
    features: [
      '5 users',
      '10 projects',
      'Email support',
      'Advanced analytics',
      'API access',
    ],
  },
  pro: {
    name: 'Pro',
    price: 99,
    priceId: process.env.STRIPE_PRO_PRICE_ID || '',
    features: [
      'Unlimited users',
      'Unlimited projects',
      'Priority support',
      'Advanced analytics',
      'API access',
      'Custom integrations',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    price: 299,
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || '',
    features: [
      'Everything in Pro',
      'Dedicated support',
      'Custom features',
      'SLA guarantee',
      'Security audit',
    ],
  },
} as const;

export function canAccessFeature(
  subscription: Subscription | null,
  feature: string
): boolean {
  if (!subscription || subscription.status !== 'active') {
    return false;
  }

  const plan = SUBSCRIPTION_PLANS[subscription.plan];
  return plan.features.includes(feature);
}

export function isSubscriptionActive(subscription: Subscription | null): boolean {
  if (!subscription) return false;
  
  return subscription.status === 'active' || subscription.status === 'trialing';
}

export function getSubscriptionEndDate(subscription: Subscription | null): Date | null {
  if (!subscription || !subscription.current_period_end) {
    return null;
  }
  
  return new Date(subscription.current_period_end);
}