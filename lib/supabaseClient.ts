// lib/supabaseClient.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables. Add them to your .env.local.'
    );
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
}

// Lazy-loaded client: only validates env vars when first used (not at build/import time)
export function getSuapabaseClient(): SupabaseClient {
  return getSupabaseClient();
}

// For backward compatibility, export as named export with lazy getter
export const supabase = {
  get auth() {
    return getSupabaseClient().auth;
  },
  get from() {
    return getSupabaseClient().from.bind(getSupabaseClient());
  },
  get rpc() {
    return getSupabaseClient().rpc.bind(getSupabaseClient());
  },
  get storage() {
    return getSupabaseClient().storage;
  },
  get realtime() {
    return getSupabaseClient().realtime;
  },
} as SupabaseClient;