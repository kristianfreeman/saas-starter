-- Seed data for development
-- This file should only be run in development environments

-- Create test users (in production, users are created through auth flow)
-- Note: In a real Supabase project, you'd create these users through the auth API
-- This is just for demonstration purposes

-- Insert test profiles
INSERT INTO public.profiles (id, email, full_name, avatar_url) VALUES
  ('11111111-1111-1111-1111-111111111111', 'free@example.com', 'Free User', 'https://api.dicebear.com/7.x/avataaars/svg?seed=free'),
  ('22222222-2222-2222-2222-222222222222', 'starter@example.com', 'Starter User', 'https://api.dicebear.com/7.x/avataaars/svg?seed=starter'),
  ('33333333-3333-3333-3333-333333333333', 'pro@example.com', 'Pro User', 'https://api.dicebear.com/7.x/avataaars/svg?seed=pro'),
  ('44444444-4444-4444-4444-444444444444', 'enterprise@example.com', 'Enterprise User', 'https://api.dicebear.com/7.x/avataaars/svg?seed=enterprise')
ON CONFLICT (id) DO NOTHING;

-- Insert test subscriptions
INSERT INTO public.subscriptions (user_id, plan, status, stripe_customer_id, stripe_subscription_id, current_period_start, current_period_end) VALUES
  ('11111111-1111-1111-1111-111111111111', 'free', 'active', NULL, NULL, NOW(), NULL),
  ('22222222-2222-2222-2222-222222222222', 'starter', 'active', 'cus_test_starter', 'sub_test_starter', NOW(), NOW() + INTERVAL '30 days'),
  ('33333333-3333-3333-3333-333333333333', 'pro', 'active', 'cus_test_pro', 'sub_test_pro', NOW(), NOW() + INTERVAL '30 days'),
  ('44444444-4444-4444-4444-444444444444', 'enterprise', 'active', 'cus_test_enterprise', 'sub_test_enterprise', NOW(), NOW() + INTERVAL '30 days')
ON CONFLICT (user_id) DO NOTHING;

-- Insert test billing history
INSERT INTO public.billing_history (user_id, subscription_id, stripe_invoice_id, amount, currency, status, invoice_url) 
SELECT 
  s.user_id,
  s.id,
  'inv_test_' || s.plan || '_' || generate_series,
  CASE s.plan
    WHEN 'starter' THEN 2900
    WHEN 'pro' THEN 9900
    WHEN 'enterprise' THEN 29900
    ELSE 0
  END,
  'usd',
  'paid',
  'https://stripe.com/invoice/test_' || s.plan || '_' || generate_series
FROM public.subscriptions s
CROSS JOIN generate_series(1, 3)
WHERE s.plan != 'free'
ON CONFLICT DO NOTHING;