import { z } from 'zod';

const envSchema = z.object({
  // Supabase
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_KEY: z.string().min(1).optional(),
  
  // Better Auth
  AUTH_SECRET: z.string().min(32).optional(),
  AUTH_URL: z.string().url().optional(),
  
  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),
  
  // Resend
  RESEND_API_KEY: z.string().startsWith('re_').optional(),
  
  // App
  PUBLIC_APP_URL: z.string().url().default('http://localhost:4321'),
  PUBLIC_APP_NAME: z.string().default('SaaS Starter'),
  
  // Node environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

type Env = z.infer<typeof envSchema>;

// Parse and validate environment variables
const parseEnv = (): Env => {
  try {
    return envSchema.parse(import.meta.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:');
      console.error(error.flatten().fieldErrors);
      throw new Error('Invalid environment variables');
    }
    throw error;
  }
};

// Export validated env object
export const env = parseEnv();

// Type-safe environment variable access
export const getEnv = <K extends keyof Env>(key: K): Env[K] => {
  return env[key];
};

// Check if all required services are configured
export const isSupabaseConfigured = (): boolean => {
  return !!(env.SUPABASE_URL && env.SUPABASE_ANON_KEY);
};

export const isAuthConfigured = (): boolean => {
  return !!(env.AUTH_SECRET && env.AUTH_URL);
};

export const isStripeConfigured = (): boolean => {
  return !!(env.STRIPE_SECRET_KEY && env.STRIPE_PUBLISHABLE_KEY);
};

export const isEmailConfigured = (): boolean => {
  return !!env.RESEND_API_KEY;
};