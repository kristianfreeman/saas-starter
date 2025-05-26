import { logError, addBreadcrumb } from './sentry';

/**
 * Global error handler setup
 */
export function setupGlobalErrorHandlers() {
  // Handle unhandled promise rejections
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      const error = new Error(`Unhandled Promise Rejection: ${event.reason}`);
      
      logError(error, {
        type: 'unhandledrejection',
        promise: event.promise,
        reason: event.reason,
      });
      
      // Prevent default browser behavior
      event.preventDefault();
    });
    
    // Handle global errors
    window.addEventListener('error', (event) => {
      logError(event.error || new Error(event.message), {
        type: 'global-error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });
    
    // Track navigation errors
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        addBreadcrumb('Page restored from cache', 'navigation');
      }
    });
    
    // Track console errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      addBreadcrumb('Console error', 'console', { arguments: args });
      originalConsoleError.apply(console, args);
    };
  }
}

/**
 * React error boundary handler
 */
export function handleReactError(error: Error, errorInfo: any) {
  logError(error, {
    componentStack: errorInfo.componentStack,
    type: 'react-error-boundary',
  });
}

/**
 * API request error handler
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Network error handler
 */
export class NetworkError extends Error {
  constructor(message: string, public url?: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * Validation error handler
 */
export class ValidationError extends Error {
  constructor(message: string, public fields?: Record<string, string[]>) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Authentication error handler
 */
export class AuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Permission error handler
 */
export class PermissionError extends Error {
  constructor(message: string, public requiredPermission?: string) {
    super(message);
    this.name = 'PermissionError';
  }
}

/**
 * Standardized error response
 */
export interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    statusCode?: number;
    details?: any;
  };
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  error: unknown,
  defaultMessage: string = 'An error occurred'
): ErrorResponse {
  if (error instanceof ApiError) {
    return {
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        details: error.details,
      },
    };
  }
  
  if (error instanceof ValidationError) {
    return {
      error: {
        message: error.message,
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        details: error.fields,
      },
    };
  }
  
  if (error instanceof AuthError) {
    return {
      error: {
        message: error.message,
        code: error.code || 'AUTH_ERROR',
        statusCode: 401,
      },
    };
  }
  
  if (error instanceof PermissionError) {
    return {
      error: {
        message: error.message,
        code: 'PERMISSION_ERROR',
        statusCode: 403,
        details: { requiredPermission: error.requiredPermission },
      },
    };
  }
  
  if (error instanceof NetworkError) {
    return {
      error: {
        message: error.message,
        code: 'NETWORK_ERROR',
        statusCode: 503,
        details: { url: error.url },
      },
    };
  }
  
  if (error instanceof Error) {
    return {
      error: {
        message: import.meta.env.PROD ? defaultMessage : error.message,
        code: 'INTERNAL_ERROR',
        statusCode: 500,
      },
    };
  }
  
  return {
    error: {
      message: defaultMessage,
      code: 'UNKNOWN_ERROR',
      statusCode: 500,
    },
  };
}

/**
 * User-friendly error messages
 */
export const USER_FRIENDLY_MESSAGES: Record<string, string> = {
  'Network request failed': 'Unable to connect to the server. Please check your internet connection.',
  'Failed to fetch': 'Unable to load data. Please try again.',
  'Invalid credentials': 'The email or password you entered is incorrect.',
  'User not found': 'No account found with this email address.',
  'Email already in use': 'An account with this email already exists.',
  'Weak password': 'Please choose a stronger password.',
  'Session expired': 'Your session has expired. Please sign in again.',
  'Permission denied': 'You do not have permission to perform this action.',
  'Rate limit exceeded': 'Too many requests. Please try again later.',
  'Invalid input': 'Please check your input and try again.',
  'Payment failed': 'Payment could not be processed. Please try again.',
  'Subscription inactive': 'Your subscription is inactive. Please update your payment method.',
};

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof Error) {
    // Check for known error messages
    for (const [key, value] of Object.entries(USER_FRIENDLY_MESSAGES)) {
      if (error.message.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }
    
    // Return original message in development
    if (!import.meta.env.PROD) {
      return error.message;
    }
  }
  
  return 'An unexpected error occurred. Please try again.';
}