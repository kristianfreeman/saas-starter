# Database Schema Documentation

This document describes the database schema for the SaaS Starter application.

## Overview

The application uses Supabase (PostgreSQL) as the database. All tables have Row Level Security (RLS) enabled for data protection.

## Tables

### profiles

Stores user profile information. Automatically created when a user signs up.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | UUID | User ID (matches auth.users.id) | Primary Key, References auth.users |
| email | TEXT | User's email address | Not Null, Unique |
| full_name | TEXT | User's full name | |
| avatar_url | TEXT | URL to user's avatar image | |
| bio | TEXT | User biography/description | |
| role | TEXT | User role (user, admin, super_admin) | Default: 'user' |
| created_at | TIMESTAMPTZ | When the profile was created | Default: NOW() |
| updated_at | TIMESTAMPTZ | When the profile was last updated | Default: NOW() |

**Indexes:**
- `idx_profiles_email` on (email)
- `idx_profiles_role` on (role)

**RLS Policies:**
- Users can view their own profile
- Users can update their own profile (except role)
- Admins can view all profiles
- Only the system can insert profiles (via trigger)

### subscriptions

Stores subscription information for users.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | UUID | Subscription ID | Primary Key, Default: gen_random_uuid() |
| user_id | UUID | User who owns the subscription | References profiles.id, Not Null |
| stripe_customer_id | TEXT | Stripe customer ID | Unique |
| stripe_subscription_id | TEXT | Stripe subscription ID | Unique |
| plan | TEXT | Subscription plan (starter, pro, enterprise) | Not Null |
| status | TEXT | Subscription status | Not Null |
| current_period_start | TIMESTAMPTZ | Start of current billing period | |
| current_period_end | TIMESTAMPTZ | End of current billing period | |
| cancel_at_period_end | BOOLEAN | Whether to cancel at period end | Default: false |
| canceled_at | TIMESTAMPTZ | When subscription was canceled | |
| created_at | TIMESTAMPTZ | When subscription was created | Default: NOW() |
| updated_at | TIMESTAMPTZ | When subscription was updated | Default: NOW() |

**Indexes:**
- `idx_subscriptions_user_id` on (user_id)
- `idx_subscriptions_stripe_customer_id` on (stripe_customer_id)
- `idx_subscriptions_stripe_subscription_id` on (stripe_subscription_id)
- `idx_subscriptions_status` on (status)

**RLS Policies:**
- Users can view their own subscription
- Admins can view all subscriptions
- Only the system can insert/update/delete subscriptions

### audit_logs

Stores audit trail of all important actions in the system.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | UUID | Log entry ID | Primary Key, Default: gen_random_uuid() |
| user_id | UUID | User who performed the action | References profiles.id |
| action | TEXT | Action performed (e.g., user.created) | Not Null |
| resource_type | TEXT | Type of resource affected | Not Null |
| resource_id | TEXT | ID of affected resource | |
| details | JSONB | Additional action details | |
| ip_address | INET | IP address of the user | |
| user_agent | TEXT | User agent string | |
| created_at | TIMESTAMPTZ | When action occurred | Default: NOW() |

**Indexes:**
- `idx_audit_logs_user_id` on (user_id)
- `idx_audit_logs_action` on (action)
- `idx_audit_logs_resource` on (resource_type, resource_id)
- `idx_audit_logs_created_at` on (created_at DESC)

**RLS Policies:**
- Only admins can view audit logs
- System can insert audit logs

### projects (Example table)

Example table for user-generated content. Replace with your actual domain objects.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | UUID | Project ID | Primary Key, Default: gen_random_uuid() |
| user_id | UUID | User who owns the project | References profiles.id, Not Null |
| name | TEXT | Project name | Not Null |
| description | TEXT | Project description | |
| is_public | BOOLEAN | Whether project is public | Default: false |
| created_at | TIMESTAMPTZ | When project was created | Default: NOW() |
| updated_at | TIMESTAMPTZ | When project was updated | Default: NOW() |

**Indexes:**
- `idx_projects_user_id` on (user_id)
- `idx_projects_is_public` on (is_public)

**RLS Policies:**
- Users can view their own projects
- Users can view public projects
- Users can create/update/delete their own projects

## Functions

### handle_new_user()

Trigger function that creates a profile when a new user signs up.

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### update_updated_at_column()

Trigger function that automatically updates the `updated_at` column.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Triggers

### on_auth_user_created

Creates a profile when a new user signs up.

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### update_profiles_updated_at

Updates the `updated_at` column on profile changes.

```sql
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### update_subscriptions_updated_at

Updates the `updated_at` column on subscription changes.

```sql
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Row Level Security (RLS)

All tables have RLS enabled to ensure data security. Key principles:

1. **Users can only access their own data** - Basic principle for user-generated content
2. **Admins have broader access** - Can view (but not always modify) more data
3. **System operations bypass RLS** - Using service role key for system operations

Example RLS policy:

```sql
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = 'user');
```

## Migrations

Database migrations are stored in `/supabase/migrations/` and are applied in order.

To create a new migration:
```bash
npm run db:migrate my_migration_name
```

To apply migrations:
```bash
npm run db:push
```

## Indexes Strategy

1. **Primary Keys** - All tables have UUID primary keys
2. **Foreign Keys** - Indexed automatically by PostgreSQL
3. **Query Patterns** - Additional indexes based on common queries
4. **Unique Constraints** - For email, Stripe IDs, etc.

## Performance Considerations

1. **Use indexes wisely** - Add indexes for frequently queried columns
2. **JSONB for flexibility** - Use JSONB for variable/extensible data
3. **Avoid N+1 queries** - Use joins or batch queries
4. **Pagination** - Always paginate large result sets
5. **Connection pooling** - Supabase handles this automatically

## Backup Strategy

1. **Automatic backups** - Supabase provides daily backups
2. **Point-in-time recovery** - Available on Pro plan
3. **Export data** - Regular exports for additional safety
4. **Test restores** - Regularly test backup restoration

## Security Best Practices

1. **Always use RLS** - Never disable RLS on tables with user data
2. **Validate inputs** - Use constraints and validation functions
3. **Parameterized queries** - Always use parameterized queries (Supabase client does this)
4. **Least privilege** - Users should only access what they need
5. **Audit sensitive operations** - Log all admin and sensitive actions