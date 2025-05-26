import type { AstroCookies } from 'astro';
import { getSession } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/client';
import { ApiErrorCode } from './types';
import { extractBearerToken } from './utils';
import type { User } from '@supabase/supabase-js';

/**
 * Verify API authentication using session cookies
 */
export async function verifyApiAuth(cookies: AstroCookies): Promise<{
  user?: User;
  error?: { code: string; message: string };
}> {
  try {
    const session = await getSession(cookies);
    
    if (!session || !session.user) {
      return {
        error: {
          code: ApiErrorCode.UNAUTHORIZED,
          message: 'Authentication required',
        },
      };
    }
    
    return { user: session.user };
  } catch (error) {
    return {
      error: {
        code: ApiErrorCode.INVALID_TOKEN,
        message: 'Invalid authentication',
      },
    };
  }
}

/**
 * Verify API authentication using Bearer token
 */
export async function verifyApiBearerAuth(request: Request): Promise<{
  user?: User;
  error?: { code: string; message: string };
}> {
  const token = extractBearerToken(request);
  
  if (!token) {
    return {
      error: {
        code: ApiErrorCode.UNAUTHORIZED,
        message: 'Bearer token required',
      },
    };
  }
  
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return {
        error: {
          code: ApiErrorCode.INVALID_TOKEN,
          message: 'Invalid or expired token',
        },
      };
    }
    
    return { user };
  } catch (error) {
    return {
      error: {
        code: ApiErrorCode.INVALID_TOKEN,
        message: 'Token verification failed',
      },
    };
  }
}

/**
 * Verify API key authentication
 */
export async function verifyApiKey(request: Request): Promise<{
  valid: boolean;
  userId?: string;
  error?: { code: string; message: string };
}> {
  const apiKey = request.headers.get('X-Api-Key');
  
  if (!apiKey) {
    return {
      valid: false,
      error: {
        code: ApiErrorCode.UNAUTHORIZED,
        message: 'API key required',
      },
    };
  }
  
  // TODO: Implement API key verification logic
  // This would typically involve checking the key against a database
  // For now, we'll just validate the format
  
  if (!apiKey.startsWith('sk_') || apiKey.length < 32) {
    return {
      valid: false,
      error: {
        code: ApiErrorCode.INVALID_TOKEN,
        message: 'Invalid API key format',
      },
    };
  }
  
  // In a real implementation, you would:
  // 1. Look up the API key in the database
  // 2. Check if it's active and not expired
  // 3. Get the associated user ID
  // 4. Check rate limits
  
  return {
    valid: true,
    userId: 'user_from_api_key', // This would come from the database
  };
}

/**
 * Check if user has required permission
 */
export async function checkPermission(
  userId: string,
  permission: string
): Promise<boolean> {
  // TODO: Implement permission checking logic
  // This would typically check user roles and permissions in the database
  
  // For now, we'll just return true for demonstration
  return true;
}

/**
 * Check if user has required subscription plan
 */
export async function checkSubscriptionPlan(
  userId: string,
  requiredPlans: string[]
): Promise<boolean> {
  // TODO: Implement subscription plan checking
  // This would check the user's active subscription against required plans
  
  // For now, we'll just return true for demonstration
  return true;
}