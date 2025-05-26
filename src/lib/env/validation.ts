import { z } from 'zod';

/**
 * Environment variable validation schema
 */
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Public URLs
  PUBLIC_SITE_URL: z.string().url().optional(),
  
  // Supabase
  PUBLIC_SUPABASE_URL: z.string().url({
    message: 'PUBLIC_SUPABASE_URL must be a valid URL'
  }),
  PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, {
    message: 'PUBLIC_SUPABASE_ANON_KEY is required'
  }),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, {
    message: 'SUPABASE_SERVICE_ROLE_KEY is required for server-side operations'
  }),
  
  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith('sk_', {
    message: 'STRIPE_SECRET_KEY must start with sk_'
  }),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_', {
    message: 'STRIPE_WEBHOOK_SECRET must start with whsec_'
  }),
  PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_', {
    message: 'PUBLIC_STRIPE_PUBLISHABLE_KEY must start with pk_'
  }),
  
  // Email (Resend)
  RESEND_API_KEY: z.string().min(1, {
    message: 'RESEND_API_KEY is required for email functionality'
  }),
  EMAIL_FROM: z.string().email({
    message: 'EMAIL_FROM must be a valid email address'
  }).default('noreply@example.com'),
  
  // Security
  ALLOWED_ORIGINS: z.string().optional(),
  RATE_LIMIT_ENABLED: z.string().transform(val => val === 'true').default('true'),
  
  // Monitoring (optional)
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  
  // Feature flags (optional)
  ENABLE_ANALYTICS: z.string().transform(val => val === 'true').default('true'),
  ENABLE_EMAIL_NOTIFICATIONS: z.string().transform(val => val === 'true').default('true'),
  MAINTENANCE_MODE: z.string().transform(val => val === 'true').default('false'),
});

/**
 * Validated environment variables
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Validate environment variables
 * @throws {Error} if validation fails
 */
export function validateEnv(): Env {
  try {
    // Parse and validate environment variables
    const env = envSchema.parse(process.env);
    
    // Additional runtime validations
    if (env.NODE_ENV === 'production') {
      // In production, ensure critical services are configured
      if (!env.PUBLIC_SITE_URL) {
        throw new Error('PUBLIC_SITE_URL is required in production');
      }
      
      // Ensure Stripe is in production mode
      if (env.STRIPE_SECRET_KEY.includes('test')) {
        console.warn('WARNING: Using Stripe test keys in production');
      }
      
      // Ensure strong security settings
      if (!env.ALLOWED_ORIGINS) {
        console.warn('WARNING: ALLOWED_ORIGINS not set, CORS will be restrictive');
      }
    }
    
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(issue => {
        return `${issue.path.join('.')}: ${issue.message}`;
      }).join('\n');
      
      throw new Error(`Environment validation failed:\n${issues}`);
    }
    throw error;
  }
}

/**
 * Get validated environment variables (cached)
 */
let cachedEnv: Env | undefined;

export function getEnv(): Env {
  if (!cachedEnv) {
    cachedEnv = validateEnv();
  }
  return cachedEnv;
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return getEnv().NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return getEnv().NODE_ENV === 'development';
}

/**
 * Check if running in test environment
 */
export function isTest(): boolean {
  return getEnv().NODE_ENV === 'test';
}

/**
 * Get public environment variables safe for client-side
 */
export function getPublicEnv() {
  const env = getEnv();
  return {
    PUBLIC_SITE_URL: env.PUBLIC_SITE_URL,
    PUBLIC_SUPABASE_URL: env.PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY: env.PUBLIC_SUPABASE_ANON_KEY,
    PUBLIC_STRIPE_PUBLISHABLE_KEY: env.PUBLIC_STRIPE_PUBLISHABLE_KEY,
    ENABLE_ANALYTICS: env.ENABLE_ANALYTICS,
    MAINTENANCE_MODE: env.MAINTENANCE_MODE,
  };
}

/**
 * Environment health check
 */
export function checkEnvHealth(): {
  status: 'healthy' | 'warning' | 'error';
  issues: string[];
} {
  const issues: string[] = [];
  
  try {
    const env = getEnv();
    
    // Check for common issues
    if (env.NODE_ENV === 'production') {
      if (env.STRIPE_SECRET_KEY.includes('test')) {
        issues.push('Using Stripe test keys in production');
      }
      
      if (!env.SENTRY_DSN) {
        issues.push('Error monitoring (Sentry) not configured');
      }
      
      if (!env.ALLOWED_ORIGINS) {
        issues.push('CORS origins not configured');
      }
    }
    
    // Check for development keys in production
    if (env.NODE_ENV === 'production') {
      if (env.PUBLIC_SUPABASE_URL.includes('localhost')) {
        issues.push('Using localhost Supabase URL in production');
      }
    }
    
    // Determine overall status
    if (issues.length === 0) {
      return { status: 'healthy', issues };
    } else if (issues.length <= 2) {
      return { status: 'warning', issues };
    } else {
      return { status: 'error', issues };
    }
  } catch (error) {
    return {
      status: 'error',
      issues: ['Environment validation failed: ' + (error as Error).message]
    };
  }
}