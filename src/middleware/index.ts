import { defineMiddleware, sequence } from 'astro:middleware';
import { onRequest as authMiddleware } from './auth';
import { securityHeaders, corsMiddleware } from './security';

// Combine all middleware in sequence
export const onRequest = sequence(
  securityHeaders,
  corsMiddleware,
  authMiddleware
);