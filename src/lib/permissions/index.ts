export { UserRole, Permission, rolePermissions } from './types';
export type { PermissionCheckResult } from './types';

export {
  getUserRole,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  checkUserPermission,
  isAdmin,
  isSuperAdmin,
  getRolePermissions,
  createPermissionGuard,
} from './utils';