import { defineMiddleware } from 'astro:middleware';
import { getSession } from '@/lib/supabase/server';

// Define protected routes
const protectedRoutes = ['/dashboard', '/profile', '/settings', '/billing'];
const authRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password'];

export const onRequest = defineMiddleware(async ({ request, cookies, redirect }, next) => {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    const session = await getSession(cookies);
    
    if (!session) {
      // Store the original URL to redirect back after login
      const redirectUrl = new URL('/auth/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return redirect(redirectUrl.toString());
    }
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute) {
    const session = await getSession(cookies);
    
    if (session) {
      const redirectTo = url.searchParams.get('redirect') || '/dashboard';
      return redirect(redirectTo);
    }
  }

  return next();
});