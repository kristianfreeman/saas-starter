import type { APIRoute } from 'astro';
import { z } from 'zod';
import { 
  createApiResponse, 
  createErrorResponse,
  validateRequestBody,
} from '@/lib/api/utils';
import { verifyApiAuth, verifyApiBearerAuth } from '@/lib/api/auth';
import { checkRateLimit, RateLimits, getRateLimitKeyForUser, addRateLimitHeaders } from '@/lib/api/rate-limit';
import { ApiErrorCode, HttpStatus } from '@/lib/api/types';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Schema for updating a project
const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  is_public: z.boolean().optional(),
});

/**
 * GET /api/v1/projects/:id - Get a specific project
 */
export const GET: APIRoute = async ({ params, cookies, request }) => {
  const projectId = params.id;
  
  if (!projectId) {
    return createErrorResponse(
      ApiErrorCode.MISSING_FIELD,
      'Project ID is required',
      HttpStatus.BAD_REQUEST
    );
  }

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

  try {
    const supabase = createServerSupabaseClient(cookies);
    
    // Get project
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();
    
    if (error || !project) {
      const response = createErrorResponse(
        ApiErrorCode.NOT_FOUND,
        'Project not found',
        HttpStatus.NOT_FOUND
      );
      addRateLimitHeaders(response.headers, info);
      return response;
    }
    
    const response = createApiResponse(project);
    addRateLimitHeaders(response.headers, info);
    return response;
  } catch (error) {
    console.error('Error fetching project:', error);
    const response = createErrorResponse(
      ApiErrorCode.INTERNAL_ERROR,
      'Failed to fetch project',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
    addRateLimitHeaders(response.headers, info);
    return response;
  }
};

/**
 * PUT /api/v1/projects/:id - Update a project
 */
export const PUT: APIRoute = async ({ params, cookies, request }) => {
  const projectId = params.id;
  
  if (!projectId) {
    return createErrorResponse(
      ApiErrorCode.MISSING_FIELD,
      'Project ID is required',
      HttpStatus.BAD_REQUEST
    );
  }

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
  const { data, error: validationError } = await validateRequestBody(request, updateProjectSchema);
  
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
    
    // Update project
    const { data: project, error } = await supabase
      .from('projects')
      .update({
        ...data!,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (error || !project) {
      const response = createErrorResponse(
        ApiErrorCode.NOT_FOUND,
        'Project not found',
        HttpStatus.NOT_FOUND
      );
      addRateLimitHeaders(response.headers, info);
      return response;
    }
    
    const response = createApiResponse(project);
    addRateLimitHeaders(response.headers, info);
    return response;
  } catch (error) {
    console.error('Error updating project:', error);
    const response = createErrorResponse(
      ApiErrorCode.INTERNAL_ERROR,
      'Failed to update project',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
    addRateLimitHeaders(response.headers, info);
    return response;
  }
};

/**
 * DELETE /api/v1/projects/:id - Delete a project
 */
export const DELETE: APIRoute = async ({ params, cookies, request }) => {
  const projectId = params.id;
  
  if (!projectId) {
    return createErrorResponse(
      ApiErrorCode.MISSING_FIELD,
      'Project ID is required',
      HttpStatus.BAD_REQUEST
    );
  }

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

  try {
    const supabase = createServerSupabaseClient(cookies);
    
    // Delete project
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', user.id);
    
    if (error) {
      throw error;
    }
    
    const response = new Response(null, { status: HttpStatus.NO_CONTENT });
    addRateLimitHeaders(response.headers, info);
    return response;
  } catch (error) {
    console.error('Error deleting project:', error);
    const response = createErrorResponse(
      ApiErrorCode.INTERNAL_ERROR,
      'Failed to delete project',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
    addRateLimitHeaders(response.headers, info);
    return response;
  }
};