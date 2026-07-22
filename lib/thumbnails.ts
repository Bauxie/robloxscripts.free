import type { ScriptView } from "@/lib/store";
import { getPlaceThumbnails } from "@/lib/roblox";
import { getAdminClient } from "@/lib/supabase/admin";
import { normalizeRoles, type RoleId } from "@/lib/roles";

/** Attach Roblox game thumbnails onto public script views. */
export async function withThumbnails(scripts: ScriptView[]): Promise<ScriptView[]> {
  const placeIds = scripts
    .map((s) => s.gamePlaceId)
    .filter((id): id is string => Boolean(id));

  if (!placeIds.length) return scripts;

  const thumbs = await getPlaceThumbnails(placeIds);
  return scripts.map((s) => ({
    ...s,
    thumbnailUrl: s.gamePlaceId ? thumbs.get(s.gamePlaceId) || null : null,
  }));
}

function isMissingColumnError(error: { message?: string; code?: string } | null): boolean {
  if (!error?.message) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("does not exist") ||
    msg.includes("could not find") ||
    msg.includes("schema cache") ||
    error.code === "PGRST204" ||
    error.code === "42703"
  );
}

/** Attach author avatar URLs + roles from profiles (by user_id). */
export async function withAuthorAvatars(scripts: ScriptView[]): Promise<ScriptView[]> {
  const userIds = [
    ...new Set(scripts.map((s) => s.userId).filter((id): id is string => Boolean(id))),
  ];
  if (!userIds.length) {
    return scripts.map((s) => ({
      ...s,
      authorAvatar: s.authorAvatar ?? null,
      authorRoles: s.authorRoles ?? [],
    }));
  }

  const admin = getAdminClient();
  let data: Array<Record<string, unknown>> | null = null;

  const full = await admin.from("profiles").select("id, avatar_url, roles").in("id", userIds);
  if (full.error && isMissingColumnError(full.error)) {
    const basic = await admin.from("profiles").select("id, avatar_url").in("id", userIds);
    if (basic.error) throw new Error(basic.error.message);
    data = (basic.data || []) as Array<Record<string, unknown>>;
  } else if (full.error) {
    throw new Error(full.error.message);
  } else {
    data = (full.data || []) as Array<Record<string, unknown>>;
  }

  const map = new Map<string, { avatar: string | null; roles: RoleId[] }>();
  for (const row of data || []) {
    map.set(String(row.id), {
      avatar: (row.avatar_url as string | null) || null,
      roles: normalizeRoles(row.roles),
    });
  }

  return scripts.map((s) => {
    const info = s.userId ? map.get(s.userId) : undefined;
    return {
      ...s,
      authorAvatar: info?.avatar ?? null,
      authorRoles: info?.roles ?? [],
    };
  });
}

/** Thumbnails + author avatars/roles for list cards. */
export async function enrichScriptViews(scripts: ScriptView[]): Promise<ScriptView[]> {
  const withThumbs = await withThumbnails(scripts);
  return withAuthorAvatars(withThumbs);
}
