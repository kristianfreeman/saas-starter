import type { APIRoute } from 'astro';
import { z } from 'zod';
import { 
  createApiResponse, 
  createErrorResponse,
  validateRequestBody,
  parsePaginationParams,
  calculatePaginationMeta,
} from '@/lib/api/utils';
import { verifyApiAuth, verifyApiBearerAuth } from '@/lib/api/auth';
import { checkRateLimit, RateLimits, getRateLimitKeyForUser, addRateLimitHeaders } from '@/lib/api/rate-limit';
import { ApiErrorCode, HttpStatus } from '@/lib/api/types';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Schema for creating a project
const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  is_public: z.boolean().default(false),
});

// Schema for updating a project
const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  is_public: z.boolean().optional(),
});

/**
 * GET /api/v1/projects - List user's projects
 */
export const GET: APIRoute = async ({ cookies, request }) => {
  // Authenticate user
  const sessionAuth = await verifyApiAuth(cookies);
  const bearerAuth = !sessionAuth.user ? await verifyApiBearerAuth(request) : { user: sessionAuth.user };
  
  const user = sessionAuth.user || bearerAuth.user;
  if (!user) {
    const error = sessionAuth.error || bearerAuth.error;
    return createErrorResponse(
      error?.code || ApiErrorCode.UNAUTHORIZED,
      error?.message || 'Authentication required',
      HttpStatus.UNAUTHORIZED
    );
  }

  // Check rate limit
  const rateLimitKey = getRateLimitKeyForUser(user.id);
  const { allowed, info, error: rateLimitError } = await checkRateLimit(rateLimitKey, RateLimits.read);
  
  if (!allowed) {
    const response = createErrorResponse(
      rateLimitError!.code,
      rateLimitError!.message,
      HttpStatus.TOO_MANY_REQUESTS
    );
    addRateLimitHeaders(response.headers, info);
    return response;
  }

  // Parse pagination parameters
  const { page, limit, sort, order } = parsePaginationParams(new URL(request.url));

  try {
    const supabase = createServerSupabaseClient(cookies);
    
    // Get total count
    const { count } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    
    // Get paginated projects
    let query = supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .range((page - 1) * limit, page * limit - 1);
    
    // Apply sorting
    if (sort) {
      query = query.order(sort, { ascending: order === 'asc' });
    } else {
      query = query.order('created_at', { ascending: false });
    }
    
    const { data: projects, error } = await query;
    
    if (error) {
      throw error;
    }
    
    const response = createApiResponse(
      projects || [],
      calculatePaginationMeta(count || 0, page, limit)
    );
    
    addRateLimitHeaders(response.headers, info);
    return response;
  } catch (error) {
    console.error('Error fetching projects:', error);
    const response = createErrorResponse(
      ApiErrorCode.INTERNAL_ERROR,
      'Failed to fetch projects',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
    addRateLimitHeaders(response.headers, info);
    return response;
  }
};

/**
 * POST /api/v1/projects - Create a new project
 */
export const POST: APIRoute = async ({ cookies, request }) => {
  // Authenticate user
  const sessionAuth = await verifyApiAuth(cookies);
  const bearerAuth = !sessionAuth.user ? await verifyApiBearerAuth(request) : { user: sessionAuth.user };
  
  const user = sessionAuth.user || bearerAuth.user;
  if (!user) {
    const error = sessionAuth.error || bearerAuth.error;
    return createErrorResponse(
      error?.code || ApiErrorCode.UNAUTHORIZED,
      error?.message || 'Authentication required',
      HttpStatus.UNAUTHORIZED
    );
  }

  // Check rate limit
  const rateLimitKey = getRateLimitKeyForUser(user.id);
  const { allowed, info, error: rateLimitError } = await checkRateLimit(rateLimitKey, RateLimits.write);
  
  if (!allowed) {
    const response = createErrorResponse(
      rateLimitError!.code,
      rateLimitError!.message,
      HttpStatus.TOO_MANY_REQUESTS
    );
    addRateLimitHeaders(response.headers, info);
    return response;
  }

  // Validate request body
  const { data, error: validationError } = await validateRequestBody(request, createProjectSchema);
  
  if (validationError) {
    const response = createErrorResponse(
      validationError.code,
      validationError.message,
      HttpStatus.BAD_REQUEST,
      validationError.details
    );
    addRateLimitHeaders(response.headers, info);
    return response;
  }

  try {
    const supabase = createServerSupabaseClient(cookies);
    
    // Create project
    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        ...data!,
        user_id: user.id,
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    const response = createApiResponse(project, undefined, HttpStatus.CREATED);
    addRateLimitHeaders(response.headers, info);
    return response;
  } catch (error) {
    console.error('Error creating project:', error);
    const response = createErrorResponse(
      ApiErrorCode.INTERNAL_ERROR,
      'Failed to create project',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
    addRateLimitHeaders(response.headers, info);
    return response;
  }
};