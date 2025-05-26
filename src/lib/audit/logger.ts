import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

export interface AuditLogEntry {
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, any>;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
}

export class AuditLogger {
  constructor(private supabase: SupabaseClient<Database>) {}

  async log(entry: AuditLogEntry): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('audit_logs')
        .insert({
          action: entry.action,
          resource_type: entry.resource_type,
          resource_id: entry.resource_id,
          details: entry.details,
          user_id: entry.user_id,
          ip_address: entry.ip_address,
          user_agent: entry.user_agent,
        });

      if (error) {
        console.error('Failed to write audit log:', error);
      }
    } catch (error) {
      console.error('Audit logging error:', error);
    }
  }

  // Convenience methods for common actions
  async logUserAction(
    action: string,
    userId: string,
    details?: Record<string, any>,
    request?: Request
  ): Promise<void> {
    await this.log({
      action: `user.${action}`,
      resource_type: 'user',
      resource_id: userId,
      details,
      ...this.extractRequestInfo(request),
    });
  }

  async logAdminAction(
    action: string,
    adminId: string,
    resourceType: string,
    resourceId?: string,
    details?: Record<string, any>,
    request?: Request
  ): Promise<void> {
    await this.log({
      action: `admin.${action}`,
      resource_type: resourceType,
      resource_id: resourceId,
      user_id: adminId,
      details,
      ...this.extractRequestInfo(request),
    });
  }

  async logAuthEvent(
    event: string,
    userId?: string,
    details?: Record<string, any>,
    request?: Request
  ): Promise<void> {
    await this.log({
      action: `auth.${event}`,
      resource_type: 'auth',
      user_id: userId,
      details,
      ...this.extractRequestInfo(request),
    });
  }

  async logSubscriptionEvent(
    event: string,
    subscriptionId: string,
    userId?: string,
    details?: Record<string, any>,
    request?: Request
  ): Promise<void> {
    await this.log({
      action: `subscription.${event}`,
      resource_type: 'subscription',
      resource_id: subscriptionId,
      user_id: userId,
      details,
      ...this.extractRequestInfo(request),
    });
  }

  async logSystemEvent(
    event: string,
    details?: Record<string, any>,
    request?: Request
  ): Promise<void> {
    await this.log({
      action: `system.${event}`,
      resource_type: 'system',
      details,
      ...this.extractRequestInfo(request),
    });
  }

  private extractRequestInfo(request?: Request): {
    ip_address?: string;
    user_agent?: string;
  } {
    if (!request) return {};

    return {
      ip_address: this.getClientIp(request),
      user_agent: request.headers.get('user-agent') || undefined,
    };
  }

  private getClientIp(request: Request): string | undefined {
    // Check various headers for the client IP
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    const realIp = request.headers.get('x-real-ip');
    if (realIp) {
      return realIp;
    }

    // Fallback to remote address if available
    // Note: This might not be available in all environments
    return undefined;
  }
}

// Audit log action constants
export const AuditActions = {
  // User actions
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  USER_BANNED: 'user.banned',
  USER_UNBANNED: 'user.unbanned',
  USER_ROLE_CHANGED: 'user.role_changed',

  // Auth actions
  AUTH_LOGIN: 'auth.login',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_FAILED_LOGIN: 'auth.failed_login',
  AUTH_PASSWORD_RESET: 'auth.password_reset',
  AUTH_PASSWORD_CHANGED: 'auth.password_changed',
  AUTH_EMAIL_VERIFIED: 'auth.email_verified',

  // Admin actions
  ADMIN_USER_VIEWED: 'admin.user_viewed',
  ADMIN_USER_MODIFIED: 'admin.user_modified',
  ADMIN_USER_DELETED: 'admin.user_deleted',
  ADMIN_SUBSCRIPTION_CANCELED: 'admin.subscription_canceled',
  ADMIN_SUBSCRIPTION_REACTIVATED: 'admin.subscription_reactivated',
  ADMIN_REFUND_ISSUED: 'admin.refund_issued',
  ADMIN_EXPORTED_DATA: 'admin.exported_data',

  // Subscription actions
  SUBSCRIPTION_CREATED: 'subscription.created',
  SUBSCRIPTION_UPDATED: 'subscription.updated',
  SUBSCRIPTION_CANCELED: 'subscription.canceled',
  SUBSCRIPTION_REACTIVATED: 'subscription.reactivated',
  SUBSCRIPTION_EXPIRED: 'subscription.expired',
  SUBSCRIPTION_PAYMENT_FAILED: 'subscription.payment_failed',

  // System actions
  SYSTEM_ERROR: 'system.error',
  SYSTEM_MAINTENANCE: 'system.maintenance',
  SYSTEM_CONFIG_CHANGED: 'system.config_changed',
  SYSTEM_BACKUP_CREATED: 'system.backup_created',
} as const;

export type AuditAction = typeof AuditActions[keyof typeof AuditActions];