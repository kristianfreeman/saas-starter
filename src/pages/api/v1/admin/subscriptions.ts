import type { APIRoute } from 'astro';
import { createApiResponse, createErrorResponse } from '@/lib/api/response';
import { authenticateRequest } from '@/lib/api/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getUserRole, isAdmin } from '@/lib/permissions';
import { rateLimit } from '@/lib/api/rate-limit';
import { stripe } from '@/lib/stripe/client';
import { AuditLogger } from '@/lib/audit/logger';

export const GET: APIRoute = async ({ request, cookies }) => {
  // Apply rate limiting
  const rateLimitResult = await rateLimit(request, 'read');
  if (!rateLimitResult.allowed) {
    return createErrorResponse('Too many requests', 429, {
      'X-RateLimit-Limit': rateLimitResult.limit.toString(),
      'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
    });
  }

  // Authenticate request
  const auth = await authenticateRequest(request, cookies);
  if (!auth.authenticated || !auth.user) {
    return createErrorResponse('Unauthorized', 401);
  }

  // Check admin permissions
  const supabase = createServerSupabaseClient(cookies);
  const role = await getUserRole(supabase, auth.user.id);
  
  if (!isAdmin(role)) {
    return createErrorResponse('Forbidden: Admin access required', 403);
  }

  try {
    // Parse query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const status = url.searchParams.get('status') || '';
    const plan = url.searchParams.get('plan') || '';

    // Validate pagination
    if (page < 1 || limit < 1 || limit > 100) {
      return createErrorResponse('Invalid pagination parameters', 400);
    }

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('subscriptions')
      .select(`
        *,
        profiles!inner(
          id,
          email,
          full_name
        )
      `, { count: 'exact' });

    // Apply filters
    if (status && ['active', 'canceled', 'past_due', 'trialing'].includes(status)) {
      query = query.eq('status', status);
    }

    if (plan && ['starter', 'pro', 'enterprise'].includes(plan)) {
      query = query.eq('plan', plan);
    }

    // Apply sorting and pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      throw error;
    }

    // Get revenue metrics
    const { data: activeSubscriptions } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('status', 'active');

    const planPrices = {
      starter: 9,
      pro: 29,
      enterprise: 99,
    };

    const mrr = activeSubscriptions?.reduce((total, sub) => {
      return total + (planPrices[sub.plan as keyof typeof planPrices] || 0);
    }, 0) || 0;

    return createApiResponse({
      subscriptions: data || [],
      metrics: {
        total_mrr: mrr,
        active_subscriptions: activeSubscriptions?.length || 0,
      },
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Admin subscriptions API error:', error);
    return createErrorResponse('Internal server error', 500);
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  // Apply rate limiting
  const rateLimitResult = await rateLimit(request, 'write');
  if (!rateLimitResult.allowed) {
    return createErrorResponse('Too many requests', 429, {
      'X-RateLimit-Limit': rateLimitResult.limit.toString(),
      'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
    });
  }

  // Authenticate request
  const auth = await authenticateRequest(request, cookies);
  if (!auth.authenticated || !auth.user) {
    return createErrorResponse('Unauthorized', 401);
  }

  // Check admin permissions
  const supabase = createServerSupabaseClient(cookies);
  const role = await getUserRole(supabase, auth.user.id);
  
  if (!isAdmin(role)) {
    return createErrorResponse('Forbidden: Admin access required', 403);
  }

  try {
    const body = await request.json();
    const { action, subscription_id, reason } = body;

    if (!action || !subscription_id) {
      return createErrorResponse('Missing required fields', 400);
    }

    // Get subscription details
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*, profiles!inner(email)')
      .eq('id', subscription_id)
      .single();

    if (subError || !subscription) {
      return createErrorResponse('Subscription not found', 404);
    }

    switch (action) {
      case 'cancel': {
        if (!subscription.stripe_subscription_id) {
          return createErrorResponse('No Stripe subscription found', 400);
        }

        // Cancel subscription in Stripe
        const canceledSubscription = await stripe.subscriptions.update(
          subscription.stripe_subscription_id,
          {
            cancel_at_period_end: true,
            metadata: {
              canceled_by: 'admin',
              canceled_by_id: auth.user.id,
              cancellation_reason: reason || 'Admin action'
            }
          }
        );

        // Update local database
        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            cancel_at_period_end: true,
            canceled_at: new Date().toISOString()
          })
          .eq('id', subscription_id);

        // Log admin action
        const auditLogger = new AuditLogger(supabase);
        await auditLogger.logAdminAction(
          'subscription_canceled',
          auth.user.id,
          'subscription',
          subscription_id,
          {
            user_email: subscription.profiles.email,
            plan: subscription.plan,
            reason: reason || 'Admin action',
            canceled_by_role: role
          },
          request
        );

        return createApiResponse({
          success: true,
          message: 'Subscription canceled successfully',
          subscription: {
            id: subscription_id,
            status: 'canceled',
            cancel_at_period_end: true
          }
        });
      }

      case 'reactivate': {
        if (!subscription.stripe_subscription_id) {
          return createErrorResponse('No Stripe subscription found', 400);
        }

        if (subscription.status !== 'canceled' || !subscription.cancel_at_period_end) {
          return createErrorResponse('Subscription is not scheduled for cancellation', 400);
        }

        // Reactivate subscription in Stripe
        const reactivatedSubscription = await stripe.subscriptions.update(
          subscription.stripe_subscription_id,
          {
            cancel_at_period_end: false,
            metadata: {
              reactivated_by: 'admin',
              reactivated_by_id: auth.user.id,
              reactivation_date: new Date().toISOString()
            }
          }
        );

        // Update local database
        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            cancel_at_period_end: false,
            canceled_at: null
          })
          .eq('id', subscription_id);

        // Log admin action
        const auditLogger = new AuditLogger(supabase);
        await auditLogger.logAdminAction(
          'subscription_reactivated',
          auth.user.id,
          'subscription',
          subscription_id,
          {
            user_email: subscription.profiles.email,
            plan: subscription.plan,
            reactivated_by_role: role
          },
          request
        );

        return createApiResponse({
          success: true,
          message: 'Subscription reactivated successfully',
          subscription: {
            id: subscription_id,
            status: 'active',
            cancel_at_period_end: false
          }
        });
      }

      case 'refund': {
        if (!subscription.stripe_subscription_id) {
          return createErrorResponse('No Stripe subscription found', 400);
        }

        // Only super admins can issue refunds
        if (role !== 'super_admin') {
          return createErrorResponse('Forbidden: Super admin access required for refunds', 403);
        }

        // Get the latest invoice for this subscription
        const invoices = await stripe.invoices.list({
          subscription: subscription.stripe_subscription_id,
          limit: 1
        });

        if (invoices.data.length === 0) {
          return createErrorResponse('No invoices found for this subscription', 404);
        }

        const latestInvoice = invoices.data[0];
        if (!latestInvoice.payment_intent || typeof latestInvoice.payment_intent === 'string') {
          return createErrorResponse('No payment found for the latest invoice', 400);
        }

        // Create refund
        const refund = await stripe.refunds.create({
          payment_intent: latestInvoice.payment_intent.id,
          reason: 'requested_by_customer',
          metadata: {
            refunded_by: 'admin',
            refunded_by_id: auth.user.id,
            refund_reason: reason || 'Admin action'
          }
        });

        // Log admin action
        const auditLogger = new AuditLogger(supabase);
        await auditLogger.logAdminAction(
          'refund_issued',
          auth.user.id,
          'subscription',
          subscription_id,
          {
            user_email: subscription.profiles.email,
            plan: subscription.plan,
            refund_amount: refund.amount / 100,
            refund_currency: refund.currency,
            refund_id: refund.id,
            reason: reason || 'Admin action',
            issued_by_role: role
          },
          request
        );

        return createApiResponse({
          success: true,
          message: 'Refund processed successfully',
          refund: {
            id: refund.id,
            amount: refund.amount / 100,
            currency: refund.currency,
            status: refund.status
          }
        });
      }

      default:
        return createErrorResponse('Invalid action', 400);
    }
  } catch (error) {
    console.error('Admin subscription action error:', error);
    return createErrorResponse('Failed to process subscription action', 500);
  }
};