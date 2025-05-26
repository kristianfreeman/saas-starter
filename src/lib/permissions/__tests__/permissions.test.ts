import { describe, it, expect, vi } from 'vitest';
import { 
  getUserRole, 
  isAdmin, 
  isSuperAdmin, 
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  checkUserPermission,
  getRolePermissions,
  UserRole,
  Permission
} from '../index';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock Supabase client
const createMockSupabaseClient = (mockData?: any, mockError?: any) => {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: mockData,
            error: mockError
          }))
        }))
      }))
    }))
  } as unknown as SupabaseClient;
};

describe('Permission System', () => {
  describe('getUserRole', () => {
    it('should return user role from database', async () => {
      const mockClient = createMockSupabaseClient({ role: 'admin' });
      const role = await getUserRole(mockClient, 'user-123');
      
      expect(mockClient.from).toHaveBeenCalledWith('profiles');
      expect(role).toBe('admin');
    });

    it('should return "user" as default role when not found', async () => {
      const mockClient = createMockSupabaseClient(null, { message: 'Not found' });
      const role = await getUserRole(mockClient, 'user-123');
      
      expect(role).toBe('user');
    });

    it('should handle database errors gracefully', async () => {
      const mockClient = createMockSupabaseClient(null, { message: 'Database error' });
      const role = await getUserRole(mockClient, 'user-123');
      
      expect(role).toBe('user');
    });
  });

  describe('Role Checks', () => {
    it('should correctly identify admin roles', () => {
      expect(isAdmin('admin')).toBe(true);
      expect(isAdmin('super_admin')).toBe(true);
      expect(isAdmin('user')).toBe(false);
      expect(isAdmin('')).toBe(false);
    });

    it('should correctly identify super admin role', () => {
      expect(isSuperAdmin('super_admin')).toBe(true);
      expect(isSuperAdmin('admin')).toBe(false);
      expect(isSuperAdmin('user')).toBe(false);
      expect(isSuperAdmin('')).toBe(false);
    });
  });

  describe('hasPermission', () => {
    it('should grant all permissions to super admin', () => {
      expect(hasPermission(UserRole.SUPER_ADMIN, Permission.DELETE_USERS)).toBe(true);
      expect(hasPermission(UserRole.SUPER_ADMIN, Permission.MANAGE_ADMINS)).toBe(true);
      expect(hasPermission(UserRole.SUPER_ADMIN, Permission.VIEW_ANALYTICS)).toBe(true);
    });

    it('should grant correct permissions to admin', () => {
      expect(hasPermission(UserRole.ADMIN, Permission.VIEW_ALL_USERS)).toBe(true);
      expect(hasPermission(UserRole.ADMIN, Permission.EDIT_ALL_USERS)).toBe(true);
      expect(hasPermission(UserRole.ADMIN, Permission.VIEW_ALL_SUBSCRIPTIONS)).toBe(true);
      expect(hasPermission(UserRole.ADMIN, Permission.DELETE_USERS)).toBe(false);
      expect(hasPermission(UserRole.ADMIN, Permission.MANAGE_ADMINS)).toBe(false);
    });

    it('should grant correct permissions to regular user', () => {
      expect(hasPermission(UserRole.USER, Permission.VIEW_OWN_PROFILE)).toBe(true);
      expect(hasPermission(UserRole.USER, Permission.EDIT_OWN_PROFILE)).toBe(true);
      expect(hasPermission(UserRole.USER, Permission.DELETE_OWN_ACCOUNT)).toBe(true);
      expect(hasPermission(UserRole.USER, Permission.VIEW_ALL_USERS)).toBe(false);
      expect(hasPermission(UserRole.USER, Permission.VIEW_ANALYTICS)).toBe(false);
    });

    it('should handle invalid roles', () => {
      expect(hasPermission('invalid_role' as UserRole, Permission.VIEW_OWN_PROFILE)).toBe(false);
      expect(hasPermission('' as UserRole, Permission.VIEW_OWN_PROFILE)).toBe(false);
    });
  });

  describe('checkUserPermission', () => {
    it('should check permission for existing user', async () => {
      const mockClient = createMockSupabaseClient({ role: 'admin' });
      const result = await checkUserPermission(mockClient, 'user-123', Permission.VIEW_ALL_USERS);
      
      expect(result.hasPermission).toBe(true);
      expect(result.role).toBe('admin');
      expect(result.missingPermission).toBeUndefined();
    });

    it('should deny permission for users without access', async () => {
      const mockClient = createMockSupabaseClient({ role: 'user' });
      const result = await checkUserPermission(mockClient, 'user-123', Permission.VIEW_ALL_USERS);
      
      expect(result.hasPermission).toBe(false);
      expect(result.role).toBe('user');
      expect(result.missingPermission).toBe(Permission.VIEW_ALL_USERS);
    });

    it('should handle super admin correctly', async () => {
      const mockClient = createMockSupabaseClient({ role: 'super_admin' });
      const result = await checkUserPermission(mockClient, 'user-123', Permission.MANAGE_ADMINS);
      
      expect(result.hasPermission).toBe(true);
      expect(result.role).toBe('super_admin');
    });
  });

  describe('getRolePermissions', () => {
    it('should return all permissions for super admin', () => {
      const permissions = getRolePermissions(UserRole.SUPER_ADMIN);
      
      // Super admin should have all permissions
      expect(permissions).toContain(Permission.DELETE_USERS);
      expect(permissions).toContain(Permission.MANAGE_ADMINS);
      expect(permissions).toContain(Permission.MANAGE_SYSTEM_SETTINGS);
      expect(permissions).toContain(Permission.VIEW_OWN_PROFILE);
    });

    it('should return correct permissions for admin', () => {
      const permissions = getRolePermissions(UserRole.ADMIN);
      
      expect(permissions).toContain(Permission.VIEW_ALL_USERS);
      expect(permissions).toContain(Permission.EDIT_ALL_USERS);
      expect(permissions).toContain(Permission.VIEW_ANALYTICS);
      expect(permissions).not.toContain(Permission.DELETE_USERS);
      expect(permissions).not.toContain(Permission.MANAGE_ADMINS);
    });

    it('should return correct permissions for user', () => {
      const permissions = getRolePermissions(UserRole.USER);
      
      expect(permissions).toContain(Permission.VIEW_OWN_PROFILE);
      expect(permissions).toContain(Permission.EDIT_OWN_PROFILE);
      expect(permissions).toContain(Permission.DELETE_OWN_ACCOUNT);
      expect(permissions).not.toContain(Permission.VIEW_ALL_USERS);
      expect(permissions).not.toContain(Permission.VIEW_ANALYTICS);
    });

    it('should return empty array for invalid role', () => {
      const permissions = getRolePermissions('invalid' as UserRole);
      
      expect(permissions).toEqual([]);
    });
  });
});