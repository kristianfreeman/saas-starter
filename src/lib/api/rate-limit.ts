import { ApiErrorCode } from './types';

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Maximum requests per window
  keyPrefix?: string;  // Prefix for rate limit keys
}

interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;  // Unix timestamp when the window resets
}

// In-memory store for rate limiting (replace with Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Clean up expired rate limit entries
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Check rate limit for a given key
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{
  allowed: boolean;
  info: RateLimitInfo;
  error?: { code: string; message: string };
}> {
  // Clean up expired entries periodically
  if (Math.random() < 0.1) {
    cleanupExpiredEntries();
  }

  const now = Date.now();
  const windowStart = now - config.windowMs;
  const fullKey = config.keyPrefix ? `${config.keyPrefix}:${key}` : key;
  
  let entry = rateLimitStore.get(fullKey);
  
  // Reset if window has expired
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + config.windowMs,
    };
    rateLimitStore.set(fullKey, entry);
  }
  
  const info: RateLimitInfo = {
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - entry.count),
    reset: Math.floor(entry.resetAt / 1000),
  };
  
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      info,
      error: {
        code: ApiErrorCode.RATE_LIMIT_EXCEEDED,
        message: `Rate limit exceeded. Try again after ${new Date(entry.resetAt).toISOString()}`,
      },
    };
  }
  
  // Increment counter
  entry.count++;
  
  return {
    allowed: true,
    info: {
      ...info,
      remaining: info.remaining - 1,
    },
  };
}

/**
 * Rate limit configurations for different endpoints
 */
export const RateLimits = {
  // General API rate limit
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    keyPrefix: 'api',
  },
  
  // Stricter limit for authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    keyPrefix: 'auth',
  },
  
  // More lenient limit for read operations
  read: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 60,
    keyPrefix: 'read',
  },
  
  // Stricter limit for write operations
  write: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 10,
    keyPrefix: 'write',
  },
} as const;

/**
 * Get rate limit key for IP address
 */
export function getRateLimitKeyForIp(request: Request): string {
  // Try to get real IP from headers (for proxied requests)
  const forwardedFor = request.headers.get('X-Forwarded-For');
  const realIp = request.headers.get('X-Real-IP');
  
  if (forwardedFor) {
    // Take the first IP from the comma-separated list
    return forwardedFor.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  // Fallback to a default key if we can't determine IP
  // In production, you might want to use the request URL or other identifying info
  return 'anonymous';
}

/**
 * Get rate limit key for authenticated user
 */
export function getRateLimitKeyForUser(userId: string): string {
  return `user:${userId}`;
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  headers: Headers,
  info: RateLimitInfo
): void {
  headers.set('X-RateLimit-Limit', info.limit.toString());
  headers.set('X-RateLimit-Remaining', info.remaining.toString());
  headers.set('X-RateLimit-Reset', info.reset.toString());
}