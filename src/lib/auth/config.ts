import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

// For now, we'll use Supabase Auth directly
// Better Auth integration can be added later as it requires more complex setup

export const supabase = createClient<Database>(
  import.meta.env.PUBLIC_SUPABASE_URL || '',
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY || ''
);

export interface AuthError {
  message: string;
  status?: number;
}

export async function signUp(email: string, password: string, fullName?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return { data: null, error: { message: error.message } };
  }

  return { data, error: null };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { data: null, error: { message: error.message } };
  }

  return { data, error: null };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    return { error: { message: error.message } };
  }

  return { error: null };
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${import.meta.env.PUBLIC_APP_URL}/auth/reset-password`,
  });

  if (error) {
    return { error: { message: error.message } };
  }

  return { error: null };
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { error: { message: error.message } };
  }

  return { error: null };
}

export async function verifyEmail(token: string, email: string) {
  const { error } = await supabase.auth.verifyOtp({
    token,
    email,
    type: 'email',
  });

  if (error) {
    return { error: { message: error.message } };
  }

  return { error: null };
}