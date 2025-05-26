// API Types
export * from './types';

// API Utilities
export {
  createApiResponse,
  createErrorResponse,
  validateRequestBody,
  parsePaginationParams,
  calculatePaginationMeta,
  extractBearerToken,
  createCorsHeaders,
  handleCorsPreflightRequest,
  createApiHandler,
} from './utils';

// API Authentication
export {
  verifyApiAuth,
  verifyApiBearerAuth,
  verifyApiKey,
  checkPermission,
  checkSubscriptionPlan,
} from './auth';

// Rate Limiting
export {
  checkRateLimit,
  RateLimits,
  getRateLimitKeyForIp,
  getRateLimitKeyForUser,
  addRateLimitHeaders,
} from './rate-limit';

// API Client
export {
  ApiClient,
  ApiClientError,
  apiClient,
  profileApi,
  projectsApi,
} from './client';