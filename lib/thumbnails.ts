import type { ScriptView } from "@/lib/store";
import { getPlaceThumbnails } from "@/lib/roblox";

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
