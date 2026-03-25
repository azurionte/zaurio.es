import { SUPABASE_URL, SUPABASE_ANON_KEY, APP_BASE_URL, ENTRY_KEY } from './config.js';

export const authState = {
  client: null,
  session: null,
  mode: 'guest',
  scope: 'emprezaurio-beta:guest',
  isOwner: false
};

const OWNER_EMAILS = ['dmnrobles@gmail.com'];
const OWNER_HANDLES = ['dramazaurio'];

export function isOwnerUser(user){
  if (!user) return false;
  const email = String(user.email || '').trim().toLowerCase();
  if (OWNER_EMAILS.includes(email)) return true;
  const values = [
    user.user_metadata?.preferred_username,
    user.user_metadata?.user_name,
    user.user_metadata?.username,
    user.user_metadata?.nick,
    user.user_metadata?.nickname,
    user.user_metadata?.display_name,
    user.user_metadata?.full_name,
    user.app_metadata?.preferred_username
  ]
    .map(v => String(v || '').trim().toLowerCase())
    .filter(Boolean);
  return values.some(v => OWNER_HANDLES.includes(v));
}

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
    authState.isOwner = isOwnerUser(authState.session?.user);
  } catch {
    authState.session = null;
    authState.isOwner = false;
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
