import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { stripe, stripeConfig } from '@/lib/stripe/client';
import { syncSubscriptionToDatabase } from '@/lib/stripe/utils';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

// Create a Supabase client with service role for webhook processing
const webhookSupabase = createClient<Database>(
  import.meta.env.PUBLIC_SUPABASE_URL || '',
  import.meta.env.SUPABASE_SERVICE_KEY || ''
);

export const POST: APIRoute = async ({ request }) => {
  if (!stripe) {
    return new Response('Stripe not configured', { status: 500 });
  }

  // Get the raw body as text for signature verification
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return new Response('No signature', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      stripeConfig.webhookSecret
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return new Response('Invalid signature', { status: 400 });
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Handle successful checkout
        if (session.mode === 'subscription' && session.subscription) {
          const subscriptionId = session.subscription as string;
          const customerId = session.customer as string;
          
          await syncSubscriptionToDatabase(
            subscriptionId,
            customerId,
            webhookSupabase
          );
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        await syncSubscriptionToDatabase(
          subscription.id,
          subscription.customer as string,
          webhookSupabase
        );
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Mark subscription as canceled in the database
        await webhookSupabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', subscription.id);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Update subscription if this is a renewal
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );
          
          await syncSubscriptionToDatabase(
            subscription.id,
            subscription.customer as string,
            webhookSupabase
          );
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Handle failed payment
        if (invoice.subscription) {
          await webhookSupabase
            .from('subscriptions')
            .update({
              status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('id', invoice.subscription);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response('Webhook processing failed', { status: 500 });
  }
};