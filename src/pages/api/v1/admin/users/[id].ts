import type { APIRoute } from 'astro';
import { createApiResponse, createErrorResponse } from '@/lib/api/response';
import { authenticateRequest } from '@/lib/api/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getUserRole, isAdmin } from '@/lib/permissions';
import { rateLimit } from '@/lib/api/rate-limit';
import { AuditLogger, AuditActions } from '@/lib/audit/logger';

export const GET: APIRoute = async ({ params, request, cookies }) => {
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

  const userId = params.id;
  if (!userId) {
    return createErrorResponse('User ID required', 400);
  }

  try {
    // Get user details
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return createErrorResponse('User not found', 404);
    }

    // Get subscription details
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    // Get user activity (last sign in)
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);

    // Log admin action
    const auditLogger = new AuditLogger(supabase);
    await auditLogger.logAdminAction(
      'user_viewed',
      auth.user.id,
      'user',
      userId,
      { viewed_by_role: role },
      request
    );

    return createApiResponse({
      user: {
        ...user,
        subscription: subscription || null,
        last_sign_in: authUser?.user?.last_sign_in_at || null
      }
    });
  } catch (error) {
    console.error('Admin get user error:', error);
    return createErrorResponse('Internal server error', 500);
  }
};

export const PATCH: APIRoute = async ({ params, request, cookies }) => {
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

  const userId = params.id;
  if (!userId) {
    return createErrorResponse('User ID required', 400);
  }

  try {
    const body = await request.json();
    const { full_name, role: newRole, banned } = body;

    // Get current user to check permissions
    const { data: targetUser, error: fetchError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (fetchError || !targetUser) {
      return createErrorResponse('User not found', 404);
    }

    // Only super admins can modify other admins
    if (targetUser.role === 'admin' || targetUser.role === 'super_admin') {
      if (role !== 'super_admin') {
        return createErrorResponse('Forbidden: Cannot modify admin users', 403);
      }
    }

    // Prevent demoting the last super admin
    if (targetUser.role === 'super_admin' && newRole !== 'super_admin') {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'super_admin');

      if (count === 1) {
        return createErrorResponse('Cannot demote the last super admin', 400);
      }
    }

    // Update profile
    const updates: any = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (newRole !== undefined && ['user', 'admin', 'super_admin'].includes(newRole)) {
      updates.role = newRole;
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Handle ban/unban
    if (banned !== undefined) {
      if (banned) {
        // Ban user
        await supabase.auth.admin.updateUserById(userId, {
          ban_duration: '876000h' // 100 years
        });
      } else {
        // Unban user
        await supabase.auth.admin.updateUserById(userId, {
          ban_duration: 'none'
        });
      }
    }

    // Log admin action
    const auditLogger = new AuditLogger(supabase);
    const changes: Record<string, any> = {};
    if (full_name !== undefined) changes.full_name = full_name;
    if (newRole !== undefined) changes.role = { from: targetUser.role, to: newRole };
    if (banned !== undefined) changes.banned = banned;

    await auditLogger.logAdminAction(
      'user_modified',
      auth.user.id,
      'user',
      userId,
      {
        changes,
        modified_by_role: role
      },
      request
    );

    return createApiResponse({
      user: updatedUser
    });
  } catch (error) {
    console.error('Admin update user error:', error);
    return createErrorResponse('Failed to update user', 500);
  }
};

export const DELETE: APIRoute = async ({ params, request, cookies }) => {
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

  // Check super admin permissions (only super admins can delete users)
  const supabase = createServerSupabaseClient(cookies);
  const role = await getUserRole(supabase, auth.user.id);
  
  if (role !== 'super_admin') {
    return createErrorResponse('Forbidden: Super admin access required', 403);
  }

  const userId = params.id;
  if (!userId) {
    return createErrorResponse('User ID required', 400);
  }

  // Prevent self-deletion
  if (userId === auth.user.id) {
    return createErrorResponse('Cannot delete your own account', 400);
  }

  try {
    // Get user to check role
    const { data: targetUser, error: fetchError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (fetchError || !targetUser) {
      return createErrorResponse('User not found', 404);
    }

    // Prevent deleting the last super admin
    if (targetUser.role === 'super_admin') {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'super_admin');

      if (count === 1) {
        return createErrorResponse('Cannot delete the last super admin', 400);
      }
    }

    // Delete user from auth system (this cascades to profile)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteError) {
      throw deleteError;
    }

    // Log admin action
    const auditLogger = new AuditLogger(supabase);
    await auditLogger.logAdminAction(
      'user_deleted',
      auth.user.id,
      'user',
      userId,
      {
        deleted_user_role: targetUser.role,
        deleted_by_role: role
      },
      request
    );

    return createApiResponse({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Admin delete user error:', error);
    return createErrorResponse('Failed to delete user', 500);
  }
};