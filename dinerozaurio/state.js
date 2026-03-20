import { SUPABASE_URL, SUPABASE_ANON_KEY, APP_BASE_URL } from './config.js';
export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});
export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: APP_BASE_URL, scopes: 'email profile https://www.googleapis.com/auth/userinfo.email' }
  });
}
export async function signOut() { return supabase.auth.signOut(); }