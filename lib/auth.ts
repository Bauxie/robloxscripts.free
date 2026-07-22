import { createServerSupabase } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

export type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
};

function slugUsername(raw: string): string {
  let base = raw
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!base || base.length < 2) base = "user";
  return base.slice(0, 24);
}

async function ensureProfile(
  userId: string,
  meta: Record<string, unknown> | undefined,
  email: string | undefined
): Promise<Profile> {
  const admin = getAdminClient();
  const { data: existing } = await admin
    .from("profiles")
    .select("id, username, avatar_url, created_at")
    .eq("id", userId)
    .maybeSingle();
  if (existing) return existing as Profile;

  const preferred =
    (typeof meta?.full_name === "string" && meta.full_name) ||
    (typeof meta?.name === "string" && meta.name) ||
    (typeof meta?.preferred_username === "string" && meta.preferred_username) ||
    (email ? email.split("@")[0] : "") ||
    "user";

  let candidate = slugUsername(preferred);
  let suffix = 0;
  for (;;) {
    const tryName = suffix === 0 ? candidate : `${candidate}${suffix}`;
    const { data, error } = await admin
      .from("profiles")
      .insert({
        id: userId,
        username: tryName,
        avatar_url:
          typeof meta?.avatar_url === "string" && meta.avatar_url
            ? meta.avatar_url
            : null,
      })
      .select("id, username, avatar_url, created_at")
      .single();

    if (!error && data) return data as Profile;
    // Unique username conflict — try next suffix
    if (error?.code === "23505") {
      suffix += 1;
      continue;
    }
    throw new Error(error?.message || "Could not create profile");
  }
}

export async function getSessionUser() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (data) return data as Profile;

  // Session exists but no profile row (trigger missing / race) — create one.
  return ensureProfile(user.id, user.user_metadata as Record<string, unknown> | undefined, user.email);
}
