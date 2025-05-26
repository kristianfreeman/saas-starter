import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  DatabaseError,
  getProfile,
  updateProfile,
  getSubscription,
  updateSubscription,
  getSubscriptionByStripeId,
  getBillingHistory,
  canAccessFeature,
  isSubscriptionActive,
  getSubscriptionEndDate,
  SUBSCRIPTION_PLANS,
} from './utils';
import type { Database, Profile, Subscription } from './types';

// Mock Supabase client
const createMockSupabaseClient = () => {
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();
  const mockEq = vi.fn();
  const mockSingle = vi.fn();
  const mockUpdate = vi.fn();
  const mockOrder = vi.fn();
  const mockLimit = vi.fn();

  const chainableMethods = {
    select: mockSelect,
    eq: mockEq,
    single: mockSingle,
    update: mockUpdate,
    order: mockOrder,
    limit: mockLimit,
  };

  // Make each method chainable
  Object.keys(chainableMethods).forEach(method => {
    chainableMethods[method as keyof typeof chainableMethods].mockReturnValue(chainableMethods);
  });

  mockFrom.mockReturnValue(chainableMethods);

  return {
    from: mockFrom,
    mockSelect,
    mockEq,
    mockSingle,
    mockUpdate,
    mockOrder,
    mockLimit,
  };
};

describe('Database Utilities', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
  });

  describe('getProfile', () => {
    it('returns profile when found', async () => {
      const mockProfile: Profile = {
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'Test User',
        avatar_url: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.mockSingle.mockResolvedValue({ data: mockProfile, error: null });

      const result = await getProfile(mockSupabase as any, 'user-123');

      expect(result).toEqual(mockProfile);
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockSupabase.mockEq).toHaveBeenCalledWith('id', 'user-123');
    });

    it('returns null when profile not found', async () => {
      mockSupabase.mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      const result = await getProfile(mockSupabase as any, 'non-existent');

      expect(result).toBeNull();
    });

    it('throws DatabaseError on other errors', async () => {
      mockSupabase.mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'OTHER_ERROR', message: 'Database error' },
      });

      await expect(getProfile(mockSupabase as any, 'user-123')).rejects.toThrow(DatabaseError);
    });
  });

  describe('updateProfile', () => {
    it('updates profile successfully', async () => {
      const updatedProfile: Profile = {
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'Updated Name',
        avatar_url: 'https://example.com/avatar.jpg',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      mockSupabase.mockSingle.mockResolvedValue({ data: updatedProfile, error: null });

      const result = await updateProfile(mockSupabase as any, 'user-123', {
        full_name: 'Updated Name',
        avatar_url: 'https://example.com/avatar.jpg',
      });

      expect(result).toEqual(updatedProfile);
      expect(mockSupabase.mockUpdate).toHaveBeenCalledWith({
        full_name: 'Updated Name',
        avatar_url: 'https://example.com/avatar.jpg',
      });
    });

    it('throws DatabaseError on update failure', async () => {
      mockSupabase.mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'ERROR', message: 'Update failed' },
      });

      await expect(
        updateProfile(mockSupabase as any, 'user-123', { full_name: 'New Name' })
      ).rejects.toThrow(DatabaseError);
    });
  });

  describe('getSubscription', () => {
    it('returns latest subscription when found', async () => {
      const mockSubscription: Subscription = {
        id: 'sub-123',
        user_id: 'user-123',
        plan: 'pro',
        status: 'active',
        stripe_customer_id: 'cus_123',
        stripe_subscription_id: 'sub_123',
        stripe_price_id: 'price_123',
        current_period_start: '2024-01-01T00:00:00Z',
        current_period_end: '2024-02-01T00:00:00Z',
        cancel_at_period_end: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.mockSingle.mockResolvedValue({ data: mockSubscription, error: null });

      const result = await getSubscription(mockSupabase as any, 'user-123');

      expect(result).toEqual(mockSubscription);
      expect(mockSupabase.mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockSupabase.mockLimit).toHaveBeenCalledWith(1);
    });
  });

  describe('canAccessFeature', () => {
    it('returns false for null subscription', () => {
      expect(canAccessFeature(null, 'API access')).toBe(false);
    });

    it('returns false for inactive subscription', () => {
      const subscription: Subscription = {
        id: 'sub-123',
        user_id: 'user-123',
        plan: 'pro',
        status: 'canceled',
        stripe_customer_id: null,
        stripe_subscription_id: null,
        stripe_price_id: null,
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      expect(canAccessFeature(subscription, 'API access')).toBe(false);
    });

    it('returns true when feature is included in plan', () => {
      const subscription: Subscription = {
        id: 'sub-123',
        user_id: 'user-123',
        plan: 'pro',
        status: 'active',
        stripe_customer_id: null,
        stripe_subscription_id: null,
        stripe_price_id: null,
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      expect(canAccessFeature(subscription, 'API access')).toBe(true);
      expect(canAccessFeature(subscription, 'Custom integrations')).toBe(true);
    });

    it('returns false when feature is not included in plan', () => {
      const subscription: Subscription = {
        id: 'sub-123',
        user_id: 'user-123',
        plan: 'free',
        status: 'active',
        stripe_customer_id: null,
        stripe_subscription_id: null,
        stripe_price_id: null,
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      expect(canAccessFeature(subscription, 'API access')).toBe(false);
    });
  });

  describe('isSubscriptionActive', () => {
    it('returns false for null subscription', () => {
      expect(isSubscriptionActive(null)).toBe(false);
    });

    it('returns true for active subscription', () => {
      const subscription: Subscription = {
        id: 'sub-123',
        user_id: 'user-123',
        plan: 'pro',
        status: 'active',
        stripe_customer_id: null,
        stripe_subscription_id: null,
        stripe_price_id: null,
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      expect(isSubscriptionActive(subscription)).toBe(true);
    });

    it('returns true for trialing subscription', () => {
      const subscription: Subscription = {
        id: 'sub-123',
        user_id: 'user-123',
        plan: 'pro',
        status: 'trialing',
        stripe_customer_id: null,
        stripe_subscription_id: null,
        stripe_price_id: null,
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      expect(isSubscriptionActive(subscription)).toBe(true);
    });

    it('returns false for canceled subscription', () => {
      const subscription: Subscription = {
        id: 'sub-123',
        user_id: 'user-123',
        plan: 'pro',
        status: 'canceled',
        stripe_customer_id: null,
        stripe_subscription_id: null,
        stripe_price_id: null,
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      expect(isSubscriptionActive(subscription)).toBe(false);
    });
  });

  describe('getSubscriptionEndDate', () => {
    it('returns null for null subscription', () => {
      expect(getSubscriptionEndDate(null)).toBeNull();
    });

    it('returns null when no end date', () => {
      const subscription: Subscription = {
        id: 'sub-123',
        user_id: 'user-123',
        plan: 'free',
        status: 'active',
        stripe_customer_id: null,
        stripe_subscription_id: null,
        stripe_price_id: null,
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      expect(getSubscriptionEndDate(subscription)).toBeNull();
    });

    it('returns Date object for valid end date', () => {
      const endDate = '2024-02-01T00:00:00Z';
      const subscription: Subscription = {
        id: 'sub-123',
        user_id: 'user-123',
        plan: 'pro',
        status: 'active',
        stripe_customer_id: null,
        stripe_subscription_id: null,
        stripe_price_id: null,
        current_period_start: '2024-01-01T00:00:00Z',
        current_period_end: endDate,
        cancel_at_period_end: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const result = getSubscriptionEndDate(subscription);
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe('2024-02-01T00:00:00.000Z');
    });
  });
});