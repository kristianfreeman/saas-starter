import type { APIRoute } from 'astro';
import { getUser } from '@/lib/supabase/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createCheckoutSession } from '@/lib/stripe/utils';
import { getPlanById } from '@/lib/stripe/plans';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Get the authenticated user
    const user = await getUser(cookies);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get the plan from the request
    const { planId } = await request.json();
    if (!planId) {
      return new Response(JSON.stringify({ error: 'Plan ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get the plan details
    const plan = getPlanById(planId);
    if (!plan || !plan.stripePriceId) {
      return new Response(JSON.stringify({ error: 'Invalid plan' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create the checkout session
    const supabase = createServerSupabaseClient(cookies);
    const origin = new URL(request.url).origin;
    
    const { url, error } = await createCheckoutSession({
      user,
      priceId: plan.stripePriceId,
      successUrl: `${origin}/dashboard?checkout=success`,
      cancelUrl: `${origin}/pricing?checkout=cancelled`,
      supabase,
    });

    if (error || !url) {
      return new Response(JSON.stringify({ error: error || 'Failed to create session' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in create-checkout-session:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};