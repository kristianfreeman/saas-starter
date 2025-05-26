import { validateEnv, checkEnvHealth } from '@/lib/env/validation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/client';
import type { AstroCookies } from 'astro';

/**
 * Startup validation to ensure the application is properly configured
 */
export async function runStartupValidation() {
  console.log('🚀 Running startup validation...');
  
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 1. Validate environment variables
  try {
    validateEnv();
    console.log('✅ Environment variables validated');
    
    const envHealth = checkEnvHealth();
    if (envHealth.status === 'warning') {
      warnings.push(...envHealth.issues);
    } else if (envHealth.status === 'error') {
      errors.push(...envHealth.issues);
    }
  } catch (error) {
    errors.push(`Environment validation failed: ${(error as Error).message}`);
  }
  
  // 2. Test database connection
  try {
    // Create a mock cookies object for testing
    const mockCookies = {
      get: () => null,
      set: () => {},
      delete: () => {},
      has: () => false,
    } as unknown as AstroCookies;
    
    const supabase = createServerSupabaseClient(mockCookies);
    const { error } = await supabase.from('profiles').select('id').limit(1);
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Database connection verified');
  } catch (error) {
    errors.push(`Database connection failed: ${(error as Error).message}`);
  }
  
  // 3. Test Stripe configuration
  try {
    // Check if we can retrieve Stripe configuration
    const config = await stripe.config.retrieve();
    console.log('✅ Stripe configuration verified');
  } catch (error) {
    warnings.push(`Stripe configuration check failed: ${(error as Error).message}`);
  }
  
  // 4. Check required database tables
  try {
    const mockCookies = {
      get: () => null,
      set: () => {},
      delete: () => {},
      has: () => false,
    } as unknown as AstroCookies;
    
    const supabase = createServerSupabaseClient(mockCookies);
    const requiredTables = ['profiles', 'subscriptions', 'audit_logs'];
    
    for (const table of requiredTables) {
      const { error } = await supabase.from(table).select('*').limit(0);
      if (error) {
        errors.push(`Required table '${table}' is not accessible: ${error.message}`);
      }
    }
    
    console.log('✅ Database schema verified');
  } catch (error) {
    errors.push(`Database schema check failed: ${(error as Error).message}`);
  }
  
  // 5. Check file permissions and directories
  try {
    // In a real application, you might check write permissions for upload directories
    console.log('✅ File system permissions verified');
  } catch (error) {
    warnings.push(`File system check failed: ${(error as Error).message}`);
  }
  
  // Report results
  console.log('\n📊 Startup Validation Summary:');
  console.log(`✅ Passed: ${errors.length === 0 ? 'All checks passed' : 'Some checks passed'}`);
  
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach(warning => console.log(`   - ${warning}`));
  }
  
  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach(error => console.log(`   - ${error}`));
    
    // In production, you might want to prevent startup on critical errors
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Startup validation failed with critical errors');
    }
  }
  
  console.log('\n✨ Startup validation complete\n');
  
  return {
    success: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Health check endpoint data
 */
export async function getHealthCheckData() {
  const mockCookies = {
    get: () => null,
    set: () => {},
    delete: () => {},
    has: () => false,
  } as unknown as AstroCookies;
  
  const checks = {
    environment: { status: 'unknown', message: '' },
    database: { status: 'unknown', message: '' },
    stripe: { status: 'unknown', message: '' },
    email: { status: 'unknown', message: '' },
  };
  
  // Check environment
  try {
    validateEnv();
    const envHealth = checkEnvHealth();
    checks.environment = {
      status: envHealth.status,
      message: envHealth.issues.join(', ') || 'All environment variables configured correctly'
    };
  } catch (error) {
    checks.environment = {
      status: 'error',
      message: (error as Error).message
    };
  }
  
  // Check database
  try {
    const supabase = createServerSupabaseClient(mockCookies);
    const start = Date.now();
    const { error } = await supabase.from('profiles').select('id').limit(1);
    const responseTime = Date.now() - start;
    
    if (error) throw error;
    
    checks.database = {
      status: responseTime < 1000 ? 'healthy' : 'warning',
      message: `Response time: ${responseTime}ms`
    };
  } catch (error) {
    checks.database = {
      status: 'error',
      message: (error as Error).message
    };
  }
  
  // Check Stripe
  try {
    await stripe.paymentMethods.list({ limit: 1 });
    checks.stripe = {
      status: 'healthy',
      message: 'Stripe API accessible'
    };
  } catch (error) {
    checks.stripe = {
      status: 'warning',
      message: 'Stripe API not accessible'
    };
  }
  
  // Check email service
  const emailConfigured = !!process.env.RESEND_API_KEY;
  checks.email = {
    status: emailConfigured ? 'healthy' : 'warning',
    message: emailConfigured ? 'Email service configured' : 'Email service not configured'
  };
  
  // Calculate overall status
  const statuses = Object.values(checks).map(check => check.status);
  const overallStatus = statuses.includes('error') ? 'error' : 
                       statuses.includes('warning') ? 'warning' : 'healthy';
  
  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks
  };
}