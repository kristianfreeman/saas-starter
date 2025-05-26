import * as Sentry from '@sentry/astro';
import type { User } from '@supabase/supabase-js';

/**
 * Initialize Sentry error monitoring
 */
export function initSentry() {
  const dsn = import.meta.env.SENTRY_DSN;
  
  if (!dsn) {
    console.warn('Sentry DSN not configured, error monitoring disabled');
    return;
  }
  
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [
      // Browser tracing
      new Sentry.BrowserTracing({
        // Set sampling rate for performance monitoring
        tracingOrigins: ['localhost', /^\//],
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
          window.history
        ),
      }),
      // Replay sessions on error
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
    // Performance monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    
    // Session replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    // Filter out non-error logs in production
    beforeSend(event, hint) {
      // Filter out specific errors
      if (event.exception) {
        const error = hint.originalException;
        
        // Don't send network errors in development
        if (!import.meta.env.PROD && error instanceof Error) {
          if (error.message.includes('NetworkError') || 
              error.message.includes('Failed to fetch')) {
            return null;
          }
        }
        
        // Filter out specific error messages
        const ignoredMessages = [
          'ResizeObserver loop limit exceeded',
          'ResizeObserver loop completed with undelivered notifications',
          'Non-Error promise rejection captured',
        ];
        
        if (error instanceof Error && 
            ignoredMessages.some(msg => error.message.includes(msg))) {
          return null;
        }
      }
      
      return event;
    },
  });
}

/**
 * Set user context for error tracking
 */
export function setSentryUser(user: User | null) {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Log custom error with context
 */
export function logError(
  error: Error,
  context?: Record<string, any>,
  level: Sentry.SeverityLevel = 'error'
) {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('additional_info', context);
    }
    scope.setLevel(level);
    Sentry.captureException(error);
  });
}

/**
 * Log message with context
 */
export function logMessage(
  message: string,
  context?: Record<string, any>,
  level: Sentry.SeverityLevel = 'info'
) {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('additional_info', context);
    }
    scope.setLevel(level);
    Sentry.captureMessage(message);
  });
}

/**
 * Create a transaction for performance monitoring
 */
export function startTransaction(
  name: string,
  op: string = 'navigation'
): Sentry.Transaction {
  return Sentry.startTransaction({
    name,
    op,
  });
}

/**
 * Add breadcrumb for better error context
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    timestamp: Date.now() / 1000,
    data,
  });
}

/**
 * Error boundary component for React
 */
export class ErrorBoundary extends Error {
  constructor(error: Error, errorInfo: { componentStack: string }) {
    super(error.message);
    this.name = 'React Error Boundary';
    
    Sentry.withScope((scope) => {
      scope.setContext('errorBoundary', {
        componentStack: errorInfo.componentStack,
      });
      Sentry.captureException(error);
    });
  }
}

/**
 * Async error handler wrapper
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  context?: Record<string, any>
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    logError(error as Error, context);
    return null;
  }
}

/**
 * API error handler
 */
export function handleApiError(
  error: unknown,
  endpoint: string,
  method: string,
  userId?: string
): { message: string; code: string } {
  const context = {
    endpoint,
    method,
    userId,
    timestamp: new Date().toISOString(),
  };
  
  if (error instanceof Error) {
    logError(error, context);
    
    // Return sanitized error for client
    return {
      message: import.meta.env.PROD 
        ? 'An error occurred processing your request' 
        : error.message,
      code: 'API_ERROR'
    };
  }
  
  // Unknown error type
  logMessage('Unknown error type in API', { ...context, error }, 'error');
  
  return {
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR'
  };
}