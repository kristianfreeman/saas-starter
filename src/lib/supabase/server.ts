import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { AstroCookies } from 'astro';
import type { Database } from './types';

export function createServerSupabaseClient(
  cookies: AstroCookies,
  {
    supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL,
    supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
  } = {}
) {
  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      get(key: string) {
        return cookies.get(key)?.value;
      },
      set(key: string, value: string, options: CookieOptions) {
        cookies.set(key, value, options);
      },
      remove(key: string, options: CookieOptions) {
        cookies.delete(key, options);
      },
    },
  });
}

export async function getUser(cookies: AstroCookies) {
  const supabase = createServerSupabaseClient(cookies);
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

export async function getSession(cookies: AstroCookies) {
  const supabase = createServerSupabaseClient(cookies);
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    return null;
  }
  
  return session;
}