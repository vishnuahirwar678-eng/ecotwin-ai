/**
 * Safe Supabase client initialization.
 * If env vars are missing, returns a no-op mock that won't crash the app.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

interface SafeSupabase {
  client: SupabaseClient | null;
  isConfigured: boolean;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

function isNonEmpty(value: string | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

let cached: SafeSupabase | null = null;

export function getSupabase(): SafeSupabase {
  if (cached) return cached;

  if (isNonEmpty(supabaseUrl) && isNonEmpty(supabaseAnonKey)) {
    cached = {
      client: createClient(supabaseUrl, supabaseAnonKey),
      isConfigured: true,
    };
  } else {
    console.warn(
      'EcoTwin: Supabase env vars missing. Running in offline mode. ' +
      'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable persistence.'
    );
    cached = { client: null, isConfigured: false };
  }

  return cached;
}

export const supabase = getSupabase().client;
export const isSupabaseConfigured = getSupabase().isConfigured;
