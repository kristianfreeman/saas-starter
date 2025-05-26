import type { MiddlewareHandler } from 'astro';

/**
 * Security headers middleware
 * Adds security-related HTTP headers to all responses
 */
export const securityHeaders: MiddlewareHandler = async (context, next) => {
  const response = await next();
  
  // Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.stripe.com https://*.supabase.co wss://*.supabase.co",
    "frame-src 'self' https://js.stripe.com https://checkout.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ];
  
  // Development mode adjustments
  if (import.meta.env.DEV) {
    // Allow WebSocket connections for hot reload
    cspDirectives.push("connect-src 'self' ws://localhost:* wss://localhost:* https://*.supabase.co wss://*.supabase.co https://api.stripe.com");
  }
  
  response.headers.set('Content-Security-Policy', cspDirectives.join('; '));
  
  // Other security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Strict Transport Security (only in production)
  if (import.meta.env.PROD) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  return response;
};

/**
 * Rate limiting middleware for security
 * This is a basic implementation - for production, use a proper rate limiting service
 */
export const rateLimitMiddleware: MiddlewareHandler = async (context, next) => {
  // Skip rate limiting for static assets
  if (context.url.pathname.startsWith('/_') || 
      context.url.pathname.match(/\.(js|css|jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
    return next();
  }
  
  // In production, you would implement proper rate limiting here
  // using Redis, Cloudflare Rate Limiting, or similar services
  
  return next();
};

/**
 * CORS middleware for API routes
 */
export const corsMiddleware: MiddlewareHandler = async (context, next) => {
  // Only apply to API routes
  if (!context.url.pathname.startsWith('/api/')) {
    return next();
  }
  
  const origin = context.request.headers.get('origin');
  const allowedOrigins = import.meta.env.ALLOWED_ORIGINS?.split(',') || [context.url.origin];
  
  // Handle preflight requests
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigins.includes(origin || '') ? origin! : allowedOrigins[0],
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      }
    });
  }
  
  const response = await next();
  
  // Add CORS headers to response
  if (allowedOrigins.includes(origin || '')) {
    response.headers.set('Access-Control-Allow-Origin', origin!);
  } else if (import.meta.env.DEV) {
    // In development, allow localhost origins
    response.headers.set('Access-Control-Allow-Origin', '*');
  }
  
  return response;
};