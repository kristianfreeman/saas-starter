import type { APIRoute } from 'astro';
import type { ApiResponse, ApiError, PaginationParams, ApiMeta } from './types';
import { HttpStatus, ApiErrorCode } from './types';
import { z } from 'zod';

/**
 * Create a standardized API response
 */
export function createApiResponse<T>(
  data?: T,
  meta?: ApiMeta,
  status: number = HttpStatus.OK
): Response {
  const response: ApiResponse<T> = { data, meta };
  
  return new Response(JSON.stringify(response), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  code: string,
  message: string,
  status: number = HttpStatus.BAD_REQUEST,
  details?: Record<string, any>
): Response {
  const error: ApiError = { code, message, details };
  const response: ApiResponse = { error };
  
  return new Response(JSON.stringify(response), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Parse and validate pagination parameters
 */
export function parsePaginationParams(url: URL): PaginationParams {
  const params = new URLSearchParams(url.search);
  
  return {
    page: Math.max(1, parseInt(params.get('page') || '1', 10)),
    limit: Math.min(100, Math.max(1, parseInt(params.get('limit') || '10', 10))),
    sort: params.get('sort') || undefined,
    order: (params.get('order') || 'asc') as 'asc' | 'desc',
  };
}

/**
 * Calculate pagination metadata
 */
export function calculatePaginationMeta(
  total: number,
  page: number,
  limit: number
): ApiMeta {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    hasMore: page < totalPages,
  };
}

/**
 * Validate request body with Zod schema
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ data?: T; error?: ApiError }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: {
          code: ApiErrorCode.VALIDATION_ERROR,
          message: 'Invalid request body',
          details: error.errors,
        },
      };
    }
    return {
      error: {
        code: ApiErrorCode.INVALID_INPUT,
        message: 'Invalid JSON body',
      },
    };
  }
}

/**
 * Extract bearer token from Authorization header
 */
export function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Create CORS headers for API responses
 */
export function createCorsHeaders(origin?: string): HeadersInit {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Api-Key',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Handle CORS preflight requests
 */
export function handleCorsPreflightRequest(request: Request): Response | null {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: HttpStatus.NO_CONTENT,
      headers: createCorsHeaders(request.headers.get('Origin') || undefined),
    });
  }
  return null;
}

/**
 * Create a typed API handler wrapper
 */
export function createApiHandler<T = any>(
  handler: (request: Request) => Promise<ApiResponse<T>>
): APIRoute {
  return async ({ request }) => {
    // Handle CORS preflight
    const preflightResponse = handleCorsPreflightRequest(request);
    if (preflightResponse) return preflightResponse;

    try {
      const result = await handler(request);
      
      if (result.error) {
        return createErrorResponse(
          result.error.code,
          result.error.message,
          getStatusFromErrorCode(result.error.code),
          result.error.details
        );
      }
      
      return createApiResponse(result.data, result.meta);
    } catch (error) {
      console.error('API handler error:', error);
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        'An unexpected error occurred',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  };
}

/**
 * Get HTTP status code from error code
 */
function getStatusFromErrorCode(code: string): number {
  switch (code) {
    case ApiErrorCode.UNAUTHORIZED:
    case ApiErrorCode.INVALID_TOKEN:
    case ApiErrorCode.TOKEN_EXPIRED:
      return HttpStatus.UNAUTHORIZED;
    case ApiErrorCode.NOT_FOUND:
      return HttpStatus.NOT_FOUND;
    case ApiErrorCode.ALREADY_EXISTS:
      return HttpStatus.CONFLICT;
    case ApiErrorCode.VALIDATION_ERROR:
    case ApiErrorCode.INVALID_INPUT:
    case ApiErrorCode.MISSING_FIELD:
      return HttpStatus.BAD_REQUEST;
    case ApiErrorCode.RATE_LIMIT_EXCEEDED:
      return HttpStatus.TOO_MANY_REQUESTS;
    default:
      return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}