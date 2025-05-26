import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Environment validation', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('should validate PUBLIC_APP_URL format', () => {
    vi.stubEnv('PUBLIC_APP_URL', 'not-a-url');
    
    expect(() => {
      import('./env');
    }).rejects.toThrow();
  });

  it('should use default values when not provided', async () => {
    const module = await import('./env');
    
    expect(module.env.PUBLIC_APP_URL).toBe('http://localhost:4321');
    expect(module.env.PUBLIC_APP_NAME).toBe('SaaS Starter');
    expect(module.env.NODE_ENV).toBe('development');
  });

  it('should validate Stripe keys format', () => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'invalid-key');
    
    expect(() => {
      import('./env');
    }).rejects.toThrow();
  });

  it('should check service configuration', async () => {
    const module = await import('./env');
    
    expect(module.isSupabaseConfigured()).toBe(false);
    expect(module.isAuthConfigured()).toBe(false);
    expect(module.isStripeConfigured()).toBe(false);
    expect(module.isEmailConfigured()).toBe(false);
  });
});