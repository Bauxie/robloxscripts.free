import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

function readEnv(name: string): string {
  return (process.env[name] || "").trim();
}

export function getSupabaseUrl(): string {
  return (readEnv("SUPABASE_URL") || readEnv("NEXT_PUBLIC_SUPABASE_URL")).replace(/\/$/, "");
}

export function getAnonKey(): string {
  return readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export function isSupabaseConfigured(): boolean {
  const url = getSupabaseUrl();
  const key = readEnv("SUPABASE_SERVICE_ROLE_KEY") || getAnonKey();
  return Boolean(url && key);
}

export function getSupabaseConfigError(): string | null {
  const url = getSupabaseUrl();
  const serviceKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = getAnonKey();
  const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

  if (!url && !serviceKey && !anonKey) {
    return "Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and keys.";
  }
  if (!url) return "Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL).";
  if (isProd && !serviceKey) {
    return "Missing SUPABASE_SERVICE_ROLE_KEY (required in production).";
  }
  if (!serviceKey && !anonKey) return "Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY.";
  if (!url.startsWith("https://")) {
    return `SUPABASE_URL must start with https:// (got "${url.slice(0, 32)}")`;
  }
  return null;
}

/** Service-role client — bypasses RLS. Use for public reads + counters. */
export function getAdminClient(): SupabaseClient {
  if (adminClient) return adminClient;

  const configError = getSupabaseConfigError();
  if (configError) throw new Error(configError);

  const url = getSupabaseUrl();
  const serviceKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");
  const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  const key = serviceKey || (!isProd ? getAnonKey() : "");
  if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");

  adminClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClient;
}

/** @deprecated use getAdminClient */
export function getSupabase(): SupabaseClient {
  return getAdminClient();
}
