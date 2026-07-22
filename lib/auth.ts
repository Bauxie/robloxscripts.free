import { createServerSupabase } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { normalizeUsername, type Profile } from "@/lib/profile";

export type { Profile } from "@/lib/profile";
export {
  USERNAME_COOLDOWN_DAYS,
  formatCooldown,
  normalizeUsername,
  usernameCooldownRemaining,
  validateUsername,
} from "@/lib/profile";

function slugUsername(raw: string): string {
  let base = normalizeUsername(raw);
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
    .select("id, username, avatar_url, bio, created_at, username_changed_at")
    .eq("id", userId)
    .maybeSingle();
  if (existing) {
    return {
      ...(existing as Profile),
      bio: (existing as Profile).bio || "",
      username_changed_at: (existing as Profile).username_changed_at || null,
    };
  }

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
        bio: "",
      })
      .select("id, username, avatar_url, bio, created_at, username_changed_at")
      .single();

    if (!error && data) {
      return {
        ...(data as Profile),
        bio: (data as Profile).bio || "",
        username_changed_at: (data as Profile).username_changed_at || null,
      };
    }
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
    .select("id, username, avatar_url, bio, created_at, username_changed_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (data) {
    return {
      ...(data as Profile),
      bio: (data as Profile).bio || "",
      username_changed_at: (data as Profile).username_changed_at || null,
    };
  }

  return ensureProfile(user.id, user.user_metadata as Record<string, unknown> | undefined, user.email);
}
