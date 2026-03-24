import { SUPABASE_URL, SUPABASE_ANON_KEY, APP_BASE_URL, ENTRY_KEY } from './config.js';

export const authState = {
  client: null,
  session: null,
  mode: 'guest',
  scope: 'emprezaurio-beta:guest'
};

export function setEntryMode(mode){
  try { sessionStorage.setItem(ENTRY_KEY, mode); } catch {}
}

export function getEntryMode(){
  try { return sessionStorage.getItem(ENTRY_KEY) || 'guest'; } catch { return 'guest'; }
}

export function getStorageScope(){
  return authState.scope;
}

export async function signInWithGoogle(){
  if (!window.supabase) return;
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  setEntryMode('google');
  return client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: APP_BASE_URL,
      scopes: 'email profile https://www.googleapis.com/auth/userinfo.email'
    }
  });
}

export async function initAuth(){
  const requestedMode = getEntryMode();

  if (!window.supabase){
    authState.mode = requestedMode === 'google' ? 'guest' : requestedMode;
    authState.scope = `emprezaurio-beta:${authState.mode}`;
    return authState;
  }

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  authState.client = client;

  try {
    const { data: { session } } = await client.auth.getSession();
    authState.session = session || null;
  } catch {
    authState.session = null;
  }

  if (requestedMode === 'guest'){
    authState.mode = 'guest';
    authState.scope = 'emprezaurio-beta:guest';
    return authState;
  }

  if (authState.session?.user?.id){
    authState.mode = 'google';
    authState.scope = `emprezaurio-beta:user:${authState.session.user.id}`;
    setEntryMode('google');
  } else {
    authState.mode = requestedMode === 'google' ? 'guest' : requestedMode;
    authState.scope = `emprezaurio-beta:${authState.mode}`;
  }

  return authState;
}
