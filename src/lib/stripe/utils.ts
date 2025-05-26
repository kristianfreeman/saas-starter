import { stripe, isStripeConfigured } from './client';
import { getPlanByPriceId } from './plans';
import type { User } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

/**
 * Create or retrieve a Stripe customer for a user
 */
export async function createOrRetrieveCustomer(
  user: User,
  supabase: SupabaseClient<Database>
): Promise<string | null> {
  if (!isStripeConfigured()) {
    console.warn('Stripe is not configured');
    return null;
  }

  // Check if user already has a Stripe customer ID in the database
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id;
  }

  // Create a new Stripe customer
  try {
    const customer = await stripe!.customers.create({
      email: user.email,
      metadata: {
        supabase_user_id: user.id,
      },
    });

    // Save the customer ID to the database
    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customer.id })
      .eq('id', user.id);

    return customer.id;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    return null;
  }
}

/**
 * Create a Stripe Checkout session for a subscription
 */
export async function createCheckoutSession(params: {
  user: User;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  supabase: SupabaseClient<Database>;
}): Promise<{ url: string | null; error?: string }> {
  if (!isStripeConfigured()) {
    return { url: null, error: 'Stripe is not configured' };
  }

  const { user, priceId, successUrl, cancelUrl, supabase } = params;

  try {
    // Create or retrieve the Stripe customer
    const customerId = await createOrRetrieveCustomer(user, supabase);
    if (!customerId) {
      return { url: null, error: 'Failed to create customer' };
    }

    // Create the checkout session
    const session = await stripe!.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      allow_promotion_codes: true,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
        },
      },
    });

    return { url: session.url };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return { url: null, error: 'Failed to create checkout session' };
  }
}

/**
 * Create a Stripe Customer Portal session
 */
export async function createPortalSession(params: {
  user: User;
  returnUrl: string;
  supabase: SupabaseClient<Database>;
}): Promise<{ url: string | null; error?: string }> {
  if (!isStripeConfigured()) {
    return { url: null, error: 'Stripe is not configured' };
  }

  const { user, returnUrl, supabase } = params;

  try {
    // Get the user's Stripe customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return { url: null, error: 'No subscription found' };
    }

    // Create the portal session
    const session = await stripe!.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: returnUrl,
    });

    return { url: session.url };
  } catch (error) {
    console.error('Error creating portal session:', error);
    return { url: null, error: 'Failed to create portal session' };
  }
}

/**
 * Sync subscription data from Stripe to the database
 */
export async function syncSubscriptionToDatabase(
  subscriptionId: string,
  customerId: string,
  supabase: SupabaseClient<Database>
): Promise<void> {
  if (!isStripeConfigured()) {
    console.warn('Stripe is not configured');
    return;
  }

  try {
    // Retrieve the subscription from Stripe
    const subscription = await stripe!.subscriptions.retrieve(subscriptionId);

    // Get the user ID from the customer
    const customer = await stripe!.customers.retrieve(customerId);
    const userId = (customer as any).metadata?.supabase_user_id;

    if (!userId) {
      console.error('No user ID found in customer metadata');
      return;
    }

    // Get the plan details
    const priceId = subscription.items.data[0]?.price.id;
    const plan = priceId ? getPlanByPriceId(priceId) : null;

    // Update the subscription in the database
    await supabase.from('subscriptions').upsert({
      id: subscription.id,
      user_id: userId,
      status: subscription.status,
      plan: plan?.id || 'unknown',
      price_id: priceId,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error syncing subscription:', error);
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isStripeConfigured()) {
    return { success: false, error: 'Stripe is not configured' };
  }

  try {
    // Cancel at the end of the billing period
    await stripe!.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    return { success: true };
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return { success: false, error: 'Failed to cancel subscription' };
  }
}

/**
 * Resume a canceled subscription
 */
export async function resumeSubscription(
  subscriptionId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isStripeConfigured()) {
    return { success: false, error: 'Stripe is not configured' };
  }

  try {
    // Remove the cancellation
    await stripe!.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });

    return { success: true };
  } catch (error) {
    console.error('Error resuming subscription:', error);
    return { success: false, error: 'Failed to resume subscription' };
  }
}