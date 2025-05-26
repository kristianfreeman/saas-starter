import type { User } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { UserRole, Permission, rolePermissions, type PermissionCheckResult } from './types';

/**
 * Get user role from database
 */
export async function getUserRole(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<UserRole> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !data?.role) {
    return UserRole.USER; // Default to regular user
  }

  // Validate role is a valid enum value
  if (Object.values(UserRole).includes(data.role as UserRole)) {
    return data.role as UserRole;
  }

  return UserRole.USER;
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
  role: UserRole,
  permission: Permission
): boolean {
  const permissions = rolePermissions[role] || [];
  return permissions.includes(permission);
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(
  role: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(
  role: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Check user permission with detailed result
 */
export async function checkUserPermission(
  supabase: SupabaseClient<Database>,
  userId: string,
  permission: Permission
): Promise<PermissionCheckResult> {
  const role = await getUserRole(supabase, userId);
  const hasPermission = rolePermissions[role]?.includes(permission) || false;

  return {
    hasPermission,
    role,
    missingPermission: hasPermission ? undefined : permission,
  };
}

/**
 * Check if user is admin or super admin
 */
export function isAdmin(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(role: UserRole): boolean {
  return role === UserRole.SUPER_ADMIN;
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return rolePermissions[role] || [];
}

/**
 * Create permission guard for API routes
 */
export function createPermissionGuard(requiredPermissions: Permission[]) {
  return async (
    supabase: SupabaseClient<Database>,
    userId: string
  ): Promise<{ allowed: boolean; role: UserRole; missingPermissions: Permission[] }> => {
    const role = await getUserRole(supabase, userId);
    const userPermissions = getRolePermissions(role);
    
    const missingPermissions = requiredPermissions.filter(
      permission => !userPermissions.includes(permission)
    );

    return {
      allowed: missingPermissions.length === 0,
      role,
      missingPermissions,
    };
  };
}