import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const canCreateBrowserClient = typeof window !== 'undefined' && typeof WebSocket !== 'undefined';

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey && canCreateBrowserClient ? createClient(supabaseUrl, supabaseAnonKey) : null;

export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}
