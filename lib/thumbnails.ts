import type { ScriptView } from "@/lib/store";
import { getPlaceThumbnails } from "@/lib/roblox";
import { getAdminClient } from "@/lib/supabase/admin";

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

/** Attach author avatar URLs from profiles (by user_id). */
export async function withAuthorAvatars(scripts: ScriptView[]): Promise<ScriptView[]> {
  const userIds = [
    ...new Set(scripts.map((s) => s.userId).filter((id): id is string => Boolean(id))),
  ];
  if (!userIds.length) return scripts.map((s) => ({ ...s, authorAvatar: s.authorAvatar ?? null }));

  const admin = getAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id, avatar_url")
    .in("id", userIds);

  if (error) throw new Error(error.message);

  const map = new Map<string, string | null>();
  for (const row of data || []) {
    map.set(row.id as string, (row.avatar_url as string | null) || null);
  }

  return scripts.map((s) => ({
    ...s,
    authorAvatar: s.userId ? map.get(s.userId) ?? null : null,
  }));
}

/** Thumbnails + author avatars for list cards. */
export async function enrichScriptViews(scripts: ScriptView[]): Promise<ScriptView[]> {
  const withThumbs = await withThumbnails(scripts);
  return withAuthorAvatars(withThumbs);
}
