import type { APIRoute } from 'astro';
import { getUser } from '@/lib/supabase/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createPortalSession } from '@/lib/stripe/utils';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Get the authenticated user
    const user = await getUser(cookies);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create the portal session
    const supabase = createServerSupabaseClient(cookies);
    const origin = new URL(request.url).origin;
    
    const { url, error } = await createPortalSession({
      user,
      returnUrl: `${origin}/dashboard`,
      supabase,
    });

    if (error || !url) {
      return new Response(JSON.stringify({ error: error || 'Failed to create session' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in create-portal-session:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};