import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

function readEnv(name: string): string {
  // Prefer non-NEXT_PUBLIC server vars so values work after adding them on Vercel
  // without requiring a rebuild for inlined NEXT_PUBLIC_* placeholders.
  return (process.env[name] || "").trim();
}

export function isSupabaseConfigured(): boolean {
  const url = readEnv("SUPABASE_URL") || readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = readEnv("SUPABASE_SERVICE_ROLE_KEY") || readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return Boolean(url && key);
}

export function getSupabaseConfigError(): string | null {
  const url = readEnv("SUPABASE_URL") || readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = readEnv("SUPABASE_SERVICE_ROLE_KEY") || readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!url && !key) {
    return "Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.";
  }
  if (!url) return "Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL).";
  if (!key) return "Missing SUPABASE_SERVICE_ROLE_KEY.";
  if (!url.startsWith("https://")) {
    return `SUPABASE_URL must start with https:// (got "${url.slice(0, 32)}")`;
  }
  return null;
}

export function getSupabase(): SupabaseClient {
  if (client) return client;

  const configError = getSupabaseConfigError();
  if (configError) throw new Error(configError);

  const url = (readEnv("SUPABASE_URL") || readEnv("NEXT_PUBLIC_SUPABASE_URL")).replace(/\/$/, "");
  const key = readEnv("SUPABASE_SERVICE_ROLE_KEY") || readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
