import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True only when both env vars are present, so the UI can degrade gracefully. */
export const isSupabaseConfigured = Boolean(url && anonKey);

/** Supabase client — null until you add your keys to the .env file. */
export const supabase = isSupabaseConfigured ? createClient(url!, anonKey!) : null;
