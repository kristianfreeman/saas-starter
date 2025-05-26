import { defineMiddleware } from 'astro:middleware';
import { getSession, getUser } from '@/lib/supabase/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getUserRole, hasPermission, Permission } from '@/lib/permissions';

// Define protected routes
const protectedRoutes = ['/dashboard', '/profile', '/settings', '/billing'];
const authRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password'];
const adminRoutes = ['/admin'];

export const onRequest = defineMiddleware(async ({ request, cookies, redirect }, next) => {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute || isAdminRoute) {
    const session = await getSession(cookies);
    
    if (!session) {
      // Store the original URL to redirect back after login
      const redirectUrl = new URL('/auth/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return redirect(redirectUrl.toString());
    }

    // Check admin permissions
    if (isAdminRoute) {
      const user = await getUser(cookies);
      if (!user) {
        return redirect('/auth/login');
      }

      const supabase = createServerSupabaseClient(cookies);
      const role = await getUserRole(supabase, user.id);
      
      if (!hasPermission(role, Permission.VIEW_ALL_USERS)) {
        // Redirect to dashboard with insufficient permissions
        return redirect('/dashboard?error=insufficient_permissions');
      }
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