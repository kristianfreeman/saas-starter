/**
 * User roles in the system
 */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

/**
 * System permissions
 */
export enum Permission {
  // User permissions
  VIEW_OWN_PROFILE = 'view_own_profile',
  EDIT_OWN_PROFILE = 'edit_own_profile',
  DELETE_OWN_ACCOUNT = 'delete_own_account',
  
  // Admin permissions
  VIEW_ALL_USERS = 'view_all_users',
  EDIT_ALL_USERS = 'edit_all_users',
  DELETE_USERS = 'delete_users',
  VIEW_ANALYTICS = 'view_analytics',
  VIEW_SYSTEM_HEALTH = 'view_system_health',
  VIEW_AUDIT_LOGS = 'view_audit_logs',
  
  // Super admin permissions
  MANAGE_ADMINS = 'manage_admins',
  MANAGE_SYSTEM_SETTINGS = 'manage_system_settings',
  EXPORT_DATA = 'export_data',
  
  // Billing permissions
  VIEW_ALL_SUBSCRIPTIONS = 'view_all_subscriptions',
  MANAGE_SUBSCRIPTIONS = 'manage_subscriptions',
  ISSUE_REFUNDS = 'issue_refunds',
}

/**
 * Role-permission mapping
 */
export const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.USER]: [
    Permission.VIEW_OWN_PROFILE,
    Permission.EDIT_OWN_PROFILE,
    Permission.DELETE_OWN_ACCOUNT,
  ],
  [UserRole.ADMIN]: [
    // Inherit all user permissions
    Permission.VIEW_OWN_PROFILE,
    Permission.EDIT_OWN_PROFILE,
    Permission.DELETE_OWN_ACCOUNT,
    // Admin-specific permissions
    Permission.VIEW_ALL_USERS,
    Permission.EDIT_ALL_USERS,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_SYSTEM_HEALTH,
    Permission.VIEW_AUDIT_LOGS,
    Permission.VIEW_ALL_SUBSCRIPTIONS,
  ],
  [UserRole.SUPER_ADMIN]: [
    // Inherit all permissions
    ...Object.values(Permission),
  ],
};

/**
 * User permission check result
 */
export interface PermissionCheckResult {
  hasPermission: boolean;
  role: UserRole;
  missingPermission?: Permission;
}