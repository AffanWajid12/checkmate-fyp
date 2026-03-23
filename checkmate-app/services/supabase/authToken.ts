import { supabase } from './client';

/**
 * Returns the current Supabase access token (JWT) if there is an active session.
 */
export async function getSupabaseAccessToken(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting Supabase session:', error);
    return null;
  }
  return data.session?.access_token ?? null;
}
