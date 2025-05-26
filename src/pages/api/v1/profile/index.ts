import type { APIRoute } from 'astro';
import { z } from 'zod';
import { 
  createApiHandler, 
  createApiResponse, 
  createErrorResponse,
  validateRequestBody,
} from '@/lib/api/utils';
import { verifyApiAuth, verifyApiBearerAuth } from '@/lib/api/auth';
import { checkRateLimit, RateLimits, getRateLimitKeyForUser, addRateLimitHeaders } from '@/lib/api/rate-limit';
import { ApiErrorCode, HttpStatus } from '@/lib/api/types';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getProfile, updateProfile } from '@/lib/supabase/utils';

// Schema for profile updates
const updateProfileSchema = z.object({
  full_name: z.string().min(1).max(100).optional(),
  avatar_url: z.string().url().optional().nullable(),
  bio: z.string().max(500).optional(),
});

/**
 * GET /api/v1/profile - Get current user's profile
 */
export const GET: APIRoute = async ({ cookies, request }) => {
  // Authenticate user (supports both session and bearer token)
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
  
  const response = allowed
    ? await handleGetProfile(user.id, cookies)
    : createErrorResponse(
        rateLimitError!.code,
        rateLimitError!.message,
        HttpStatus.TOO_MANY_REQUESTS
      );
  
  // Add rate limit headers
  addRateLimitHeaders(response.headers, info);
  
  return response;
};

/**
 * PUT /api/v1/profile - Update current user's profile
 */
export const PUT: APIRoute = async ({ cookies, request }) => {
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
  const { data, error: validationError } = await validateRequestBody(request, updateProfileSchema);
  
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

  const response = await handleUpdateProfile(user.id, data!, cookies);
  addRateLimitHeaders(response.headers, info);
  
  return response;
};

/**
 * Handle GET profile logic
 */
async function handleGetProfile(userId: string, cookies: AstroCookies): Promise<Response> {
  try {
    const supabase = createServerSupabaseClient(cookies);
    const profile = await getProfile(supabase, userId);
    
    if (!profile) {
      return createErrorResponse(
        ApiErrorCode.NOT_FOUND,
        'Profile not found',
        HttpStatus.NOT_FOUND
      );
    }
    
    return createApiResponse({
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      bio: profile.bio,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return createErrorResponse(
      ApiErrorCode.INTERNAL_ERROR,
      'Failed to fetch profile',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * Handle PUT profile logic
 */
async function handleUpdateProfile(
  userId: string, 
  updates: z.infer<typeof updateProfileSchema>,
  cookies: AstroCookies
): Promise<Response> {
  try {
    const supabase = createServerSupabaseClient(cookies);
    
    // Update profile
    await updateProfile(supabase, userId, updates);
    
    // Fetch updated profile
    const profile = await getProfile(supabase, userId);
    
    return createApiResponse({
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      bio: profile.bio,
      updated_at: profile.updated_at,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return createErrorResponse(
      ApiErrorCode.INTERNAL_ERROR,
      'Failed to update profile',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}