import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const canCreateBrowserClient = typeof window !== 'undefined' && typeof WebSocket !== 'undefined';
const PASSWORD_RECOVERY_STORAGE_KEY = 'cuki_password_recovery_callback_v1';
const hasInitialPasswordRecoveryCallback = readPasswordRecoveryCallbackFromUrl();

if (hasInitialPasswordRecoveryCallback) {
  rememberPasswordRecoveryCallback();
}

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey && canCreateBrowserClient ? createClient(supabaseUrl, supabaseAnonKey) : null;

export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}

export function hasPasswordRecoveryCallback(): boolean {
  if (readPasswordRecoveryCallbackFromUrl()) {
    rememberPasswordRecoveryCallback();
    return true;
  }

  return (
    typeof window !== 'undefined' &&
    window.sessionStorage.getItem(PASSWORD_RECOVERY_STORAGE_KEY) === 'true'
  );
}

export function clearPasswordRecoveryCallback(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(PASSWORD_RECOVERY_STORAGE_KEY);
}

function rememberPasswordRecoveryCallback(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(PASSWORD_RECOVERY_STORAGE_KEY, 'true');
}

function readPasswordRecoveryCallbackFromUrl(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const searchParams = new URLSearchParams(window.location.search);
  const callbackType = hashParams.get('type') ?? searchParams.get('type');
  const hasRecoveryToken =
    Boolean(hashParams.get('access_token') && hashParams.get('refresh_token')) ||
    Boolean(searchParams.get('code'));

  return callbackType === 'recovery' && hasRecoveryToken;
}
