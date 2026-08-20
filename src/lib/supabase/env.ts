export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Supabase isn't connected yet (Phase 1 runs on local JSON data). Callers
 * that need the database — observations, auth — should check this first
 * and degrade gracefully rather than throwing at import time.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
