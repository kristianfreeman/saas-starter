import type { APIRoute } from 'astro';
import { createApiResponse, createErrorResponse } from '@/lib/api/response';
import { authenticateRequest } from '@/lib/api/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getUserRole, isAdmin } from '@/lib/permissions';
import { rateLimit } from '@/lib/api/rate-limit';

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
    const period = url.searchParams.get('period') || '30d';

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get new users in period
    const { count: newUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString());

    // Get active subscriptions
    const { data: activeSubscriptions, count: totalActiveSubscriptions } = await supabase
      .from('subscriptions')
      .select('plan', { count: 'exact' })
      .eq('status', 'active');

    // Calculate MRR
    const planPrices = {
      starter: 9,
      pro: 29,
      enterprise: 99,
    };

    const mrr = activeSubscriptions?.reduce((total, sub) => {
      return total + (planPrices[sub.plan as keyof typeof planPrices] || 0);
    }, 0) || 0;

    // Get subscription distribution
    const subscriptionsByPlan = activeSubscriptions?.reduce((acc, sub) => {
      acc[sub.plan] = (acc[sub.plan] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Get churn data (subscriptions canceled in period)
    const { count: churnedSubscriptions } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'canceled')
      .gte('canceled_at', startDate.toISOString());

    // Calculate churn rate
    const churnRate = totalActiveSubscriptions && totalActiveSubscriptions > 0
      ? ((churnedSubscriptions || 0) / totalActiveSubscriptions) * 100
      : 0;

    // Get daily stats for charts
    const dailyStats = [];
    const daysInPeriod = Math.ceil((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    
    for (let i = 0; i < Math.min(daysInPeriod, 30); i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      // Get users created on this day
      const { count: usersCreated } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', dayStart.toISOString())
        .lte('created_at', dayEnd.toISOString());

      // Get subscriptions created on this day
      const { count: subscriptionsCreated } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', dayStart.toISOString())
        .lte('created_at', dayEnd.toISOString());

      dailyStats.unshift({
        date: dayStart.toISOString().split('T')[0],
        users: usersCreated || 0,
        subscriptions: subscriptionsCreated || 0
      });
    }

    // Get role distribution
    const { data: roleData } = await supabase
      .from('profiles')
      .select('role');

    const roleDistribution = roleData?.reduce((acc, profile) => {
      acc[profile.role] = (acc[profile.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    return createApiResponse({
      overview: {
        total_users: totalUsers || 0,
        new_users: newUsers || 0,
        active_subscriptions: totalActiveSubscriptions || 0,
        mrr,
        churn_rate: Math.round(churnRate * 100) / 100
      },
      subscriptions: {
        by_plan: subscriptionsByPlan,
        total: totalActiveSubscriptions || 0
      },
      users: {
        by_role: roleDistribution,
        total: totalUsers || 0
      },
      daily_stats: dailyStats,
      period: {
        start: startDate.toISOString(),
        end: now.toISOString(),
        label: period
      }
    });
  } catch (error) {
    console.error('Admin stats API error:', error);
    return createErrorResponse('Internal server error', 500);
  }
};