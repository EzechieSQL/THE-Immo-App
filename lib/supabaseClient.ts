// lib/supabaseClient.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

function initSupabaseClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

  console.log('[Supabase] Initializing with URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
  console.log('[Supabase] Initializing with Anon Key:', supabaseAnonKey ? '✓ Set' : '✗ Missing');

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables. Add them to your .env.local.'
    );
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  console.log('[Supabase] Client initialized successfully');
  return supabaseInstance;
}

// Lazy-loaded client: only validates env vars when first used (not at build/import time)
export function getSupabaseClient(): SupabaseClient {
  return initSupabaseClient();
}

// For backward compatibility, export as named export with lazy getter
export const supabase = {
  get auth() {
    return initSupabaseClient().auth;
  },
  get from() {
    return initSupabaseClient().from.bind(initSupabaseClient());
  },
  get rpc() {
    return initSupabaseClient().rpc.bind(initSupabaseClient());
  },
  get storage() {
    return initSupabaseClient().storage;
  },
  get realtime() {
    return initSupabaseClient().realtime;
  },
} as SupabaseClient;