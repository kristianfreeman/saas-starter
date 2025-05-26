import type { APIRoute } from 'astro';
import { createApiResponse, createErrorResponse } from '@/lib/api/response';
import { authenticateRequest } from '@/lib/api/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getUserRole, isAdmin } from '@/lib/permissions';
import { rateLimit } from '@/lib/api/rate-limit';
import type { Database } from '@/lib/supabase/types';

export const GET: APIRoute = async ({ request, cookies }) => {
  // Apply rate limiting for admin endpoints
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
    const search = url.searchParams.get('search') || '';
    const roleFilter = url.searchParams.get('role') || '';
    const sortBy = url.searchParams.get('sortBy') || 'created_at';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';

    // Validate pagination
    if (page < 1 || limit < 1 || limit > 100) {
      return createErrorResponse('Invalid pagination parameters', 400);
    }

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    // Apply role filter
    if (roleFilter && ['user', 'admin', 'super_admin'].includes(roleFilter)) {
      query = query.eq('role', roleFilter);
    }

    // Apply sorting
    const validSortFields = ['created_at', 'email', 'full_name', 'role'];
    if (validSortFields.includes(sortBy)) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      throw error;
    }

    // Get subscription data for users
    const userIds = data?.map(u => u.id) || [];
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('user_id, plan, status')
      .in('user_id', userIds)
      .eq('status', 'active');

    // Merge subscription data with users
    const usersWithSubscriptions = data?.map(user => {
      const subscription = subscriptions?.find(s => s.user_id === user.id);
      return {
        ...user,
        subscription: subscription || null
      };
    });

    return createApiResponse({
      users: usersWithSubscriptions || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Admin users API error:', error);
    return createErrorResponse('Internal server error', 500);
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  // Apply rate limiting for admin endpoints
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

  // Check super admin permissions (only super admins can create users)
  const supabase = createServerSupabaseClient(cookies);
  const role = await getUserRole(supabase, auth.user.id);
  
  if (role !== 'super_admin') {
    return createErrorResponse('Forbidden: Super admin access required', 403);
  }

  try {
    const body = await request.json();
    const { email, password, full_name, role: newUserRole } = body;

    // Validate input
    if (!email || !password || !full_name) {
      return createErrorResponse('Missing required fields', 400);
    }

    if (!['user', 'admin'].includes(newUserRole)) {
      return createErrorResponse('Invalid role', 400);
    }

    // Create user in auth system
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name
      }
    });

    if (authError) {
      throw authError;
    }

    // Update profile with role
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: newUserRole, full_name })
      .eq('id', authData.user.id);

    if (profileError) {
      // Rollback auth user creation if profile update fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw profileError;
    }

    return createApiResponse({
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name,
        role: newUserRole,
        created_at: authData.user.created_at
      }
    }, 201);
  } catch (error) {
    console.error('Admin create user error:', error);
    return createErrorResponse('Failed to create user', 500);
  }
};