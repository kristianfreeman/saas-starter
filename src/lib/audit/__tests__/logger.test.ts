import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditLogger, AuditActions } from '../logger';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock Supabase client
const createMockSupabaseClient = () => {
  const insertMock = vi.fn().mockResolvedValue({ error: null });
  
  return {
    from: vi.fn(() => ({
      insert: insertMock
    })),
    _insertMock: insertMock // Expose for testing
  } as unknown as SupabaseClient & { _insertMock: any };
};

describe('AuditLogger', () => {
  let mockClient: SupabaseClient & { _insertMock: any };
  let auditLogger: AuditLogger;
  let consoleErrorSpy: any;

  beforeEach(() => {
    mockClient = createMockSupabaseClient();
    auditLogger = new AuditLogger(mockClient);
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('log', () => {
    it('should log basic audit entry', async () => {
      const entry = {
        action: 'test.action',
        resource_type: 'test',
        resource_id: '123',
        user_id: 'user-123'
      };

      await auditLogger.log(entry);

      expect(mockClient.from).toHaveBeenCalledWith('audit_logs');
      expect(mockClient._insertMock).toHaveBeenCalledWith({
        action: 'test.action',
        resource_type: 'test',
        resource_id: '123',
        user_id: 'user-123',
        details: undefined,
        ip_address: undefined,
        user_agent: undefined
      });
    });

    it('should handle database errors gracefully', async () => {
      mockClient._insertMock.mockResolvedValueOnce({ 
        error: { message: 'Database error' } 
      });

      const entry = {
        action: 'test.action',
        resource_type: 'test'
      };

      await auditLogger.log(entry);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to write audit log:',
        { message: 'Database error' }
      );
    });

    it('should handle exceptions gracefully', async () => {
      mockClient._insertMock.mockRejectedValueOnce(new Error('Network error'));

      const entry = {
        action: 'test.action',
        resource_type: 'test'
      };

      await auditLogger.log(entry);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Audit logging error:',
        expect.any(Error)
      );
    });
  });

  describe('logUserAction', () => {
    it('should log user action with correct format', async () => {
      await auditLogger.logUserAction('created', 'user-123', { email: 'test@example.com' });

      expect(mockClient._insertMock).toHaveBeenCalledWith({
        action: 'user.created',
        resource_type: 'user',
        resource_id: 'user-123',
        details: { email: 'test@example.com' },
        user_id: undefined,
        ip_address: undefined,
        user_agent: undefined
      });
    });

    it('should extract request info when provided', async () => {
      const mockRequest = new Request('http://example.com', {
        headers: {
          'user-agent': 'Test Browser',
          'x-forwarded-for': '192.168.1.1, 10.0.0.1'
        }
      });

      await auditLogger.logUserAction('updated', 'user-123', { field: 'name' }, mockRequest);

      expect(mockClient._insertMock).toHaveBeenCalledWith({
        action: 'user.updated',
        resource_type: 'user',
        resource_id: 'user-123',
        details: { field: 'name' },
        user_id: undefined,
        ip_address: '192.168.1.1',
        user_agent: 'Test Browser'
      });
    });
  });

  describe('logAdminAction', () => {
    it('should log admin action with all parameters', async () => {
      await auditLogger.logAdminAction(
        'user_deleted',
        'admin-123',
        'user',
        'user-456',
        { reason: 'Terms violation' }
      );

      expect(mockClient._insertMock).toHaveBeenCalledWith({
        action: 'admin.user_deleted',
        resource_type: 'user',
        resource_id: 'user-456',
        user_id: 'admin-123',
        details: { reason: 'Terms violation' },
        ip_address: undefined,
        user_agent: undefined
      });
    });
  });

  describe('logAuthEvent', () => {
    it('should log authentication event', async () => {
      await auditLogger.logAuthEvent('login', 'user-123', { method: 'password' });

      expect(mockClient._insertMock).toHaveBeenCalledWith({
        action: 'auth.login',
        resource_type: 'auth',
        resource_id: undefined,
        user_id: 'user-123',
        details: { method: 'password' },
        ip_address: undefined,
        user_agent: undefined
      });
    });

    it('should log failed auth event without user ID', async () => {
      await auditLogger.logAuthEvent('failed_login', undefined, { email: 'test@example.com' });

      expect(mockClient._insertMock).toHaveBeenCalledWith({
        action: 'auth.failed_login',
        resource_type: 'auth',
        resource_id: undefined,
        user_id: undefined,
        details: { email: 'test@example.com' },
        ip_address: undefined,
        user_agent: undefined
      });
    });
  });

  describe('logSubscriptionEvent', () => {
    it('should log subscription event', async () => {
      await auditLogger.logSubscriptionEvent(
        'canceled',
        'sub-123',
        'user-123',
        { plan: 'pro', reason: 'Too expensive' }
      );

      expect(mockClient._insertMock).toHaveBeenCalledWith({
        action: 'subscription.canceled',
        resource_type: 'subscription',
        resource_id: 'sub-123',
        user_id: 'user-123',
        details: { plan: 'pro', reason: 'Too expensive' },
        ip_address: undefined,
        user_agent: undefined
      });
    });
  });

  describe('logSystemEvent', () => {
    it('should log system event without user', async () => {
      await auditLogger.logSystemEvent('maintenance', { duration: '2 hours' });

      expect(mockClient._insertMock).toHaveBeenCalledWith({
        action: 'system.maintenance',
        resource_type: 'system',
        resource_id: undefined,
        user_id: undefined,
        details: { duration: '2 hours' },
        ip_address: undefined,
        user_agent: undefined
      });
    });
  });

  describe('Request Info Extraction', () => {
    it('should extract IP from x-forwarded-for header', async () => {
      const mockRequest = new Request('http://example.com', {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1, 172.16.0.1'
        }
      });

      await auditLogger.logSystemEvent('test', {}, mockRequest);

      expect(mockClient._insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          ip_address: '192.168.1.1'
        })
      );
    });

    it('should extract IP from x-real-ip header', async () => {
      const mockRequest = new Request('http://example.com', {
        headers: {
          'x-real-ip': '10.0.0.5'
        }
      });

      await auditLogger.logSystemEvent('test', {}, mockRequest);

      expect(mockClient._insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          ip_address: '10.0.0.5'
        })
      );
    });

    it('should handle missing request headers', async () => {
      const mockRequest = new Request('http://example.com');

      await auditLogger.logSystemEvent('test', {}, mockRequest);

      expect(mockClient._insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          ip_address: undefined,
          user_agent: undefined
        })
      );
    });
  });

  describe('AuditActions Constants', () => {
    it('should have correct action names', () => {
      expect(AuditActions.USER_CREATED).toBe('user.created');
      expect(AuditActions.AUTH_LOGIN).toBe('auth.login');
      expect(AuditActions.ADMIN_USER_VIEWED).toBe('admin.user_viewed');
      expect(AuditActions.SUBSCRIPTION_CANCELED).toBe('subscription.canceled');
      expect(AuditActions.SYSTEM_ERROR).toBe('system.error');
    });
  });
});