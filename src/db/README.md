# Database

This directory contains database-related code and configurations.

## Supabase Setup

The project uses Supabase for the database and authentication. Database utilities and types are located in `/src/lib/supabase/`.

### Database Schema

The database schema includes:
- **profiles**: User profile information
- **subscriptions**: User subscription details
- **billing_history**: Payment and invoice records

### Migrations

Database migrations are stored in `/supabase/migrations/`. To apply migrations:

1. Set up a Supabase project at https://supabase.com
2. Install the Supabase CLI
3. Run migrations: `supabase db push`

### Development Seed Data

A seed file is available at `/supabase/seed.sql` for populating test data in development.

### Type Safety

TypeScript types are automatically generated from the database schema and stored in `/src/lib/supabase/types.ts`.