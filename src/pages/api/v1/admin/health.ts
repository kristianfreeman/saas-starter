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
    // Check database health
    const dbStartTime = Date.now();
    const { error: dbError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    const dbResponseTime = Date.now() - dbStartTime;

    const databaseHealth = {
      status: dbError ? 'unhealthy' : 'healthy',
      response_time_ms: dbResponseTime,
      error: dbError?.message || null
    };

    // Check auth health
    const authHealth = {
      status: 'healthy',
      authenticated: true,
      session_valid: true
    };

    // Check email service
    const emailConfigured = !!process.env.RESEND_API_KEY;
    const emailHealth = {
      status: emailConfigured ? 'healthy' : 'unhealthy',
      configured: emailConfigured,
      error: emailConfigured ? null : 'Email service not configured'
    };

    // Check Stripe
    const stripeConfigured = !!process.env.STRIPE_SECRET_KEY;
    const stripeHealth = {
      status: stripeConfigured ? 'healthy' : 'unhealthy',
      configured: stripeConfigured,
      webhook_configured: !!process.env.STRIPE_WEBHOOK_SECRET,
      error: stripeConfigured ? null : 'Stripe not configured'
    };

    // Get memory usage
    const memoryUsage = process.memoryUsage();
    const systemResources = {
      memory: {
        heap_used_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heap_total_mb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        rss_mb: Math.round(memoryUsage.rss / 1024 / 1024),
        external_mb: Math.round((memoryUsage.external || 0) / 1024 / 1024),
        heap_percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
      },
      uptime: {
        seconds: process.uptime(),
        formatted: formatUptime(process.uptime())
      }
    };

    // Calculate overall status
    const services = [databaseHealth, authHealth, emailHealth, stripeHealth];
    const unhealthyCount = services.filter(s => s.status === 'unhealthy').length;
    const overallStatus = unhealthyCount === 0 ? 'healthy' : 
                         unhealthyCount >= 2 ? 'critical' : 'degraded';

    return createApiResponse({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: {
        database: databaseHealth,
        authentication: authHealth,
        email: emailHealth,
        payments: stripeHealth
      },
      system: systemResources,
      environment: {
        node_version: process.version,
        environment: process.env.NODE_ENV || 'development',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    });
  } catch (error) {
    console.error('Admin health check error:', error);
    return createErrorResponse('Health check failed', 500);
  }
};

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
}