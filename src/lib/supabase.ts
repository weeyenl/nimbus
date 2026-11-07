import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * True when both public Supabase env vars are present. When false the app runs in
 * demo mode (mock data kept in this browser only, no login).
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Placeholder values keep createClient() from throwing at import time in demo mode.
export const supabase = createClient(
  supabaseUrl || "http://localhost:54321",
  supabaseAnonKey || "demo-anon-key"
);
