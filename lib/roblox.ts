/** Parse a Roblox place ID from a games URL, share-ish URL, or bare numeric ID. */
export function parsePlaceId(input: string): string | null {
  const raw = (input || "").trim();
  if (!raw) return null;

  if (/^\d{1,15}$/.test(raw)) return raw;

  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    const host = url.hostname.replace(/^www\./, "");
    if (!host.endsWith("roblox.com")) return null;

    const games = url.pathname.match(/\/games\/(\d+)/);
    if (games?.[1]) return games[1];

    const placeId = url.searchParams.get("placeId") || url.searchParams.get("placeid");
    if (placeId && /^\d{1,15}$/.test(placeId)) return placeId;
  } catch {
    // not a URL
  }

  const fallback = raw.match(/(?:games\/|placeId=)(\d{1,15})/i);
  return fallback?.[1] || null;
}

export function robloxGameUrl(placeId: string): string {
  return `https://www.roblox.com/games/${placeId}`;
}

export type RobloxGameInfo = {
  placeId: string;
  name: string | null;
  thumbnailUrl: string | null;
  playUrl: string;
};

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "robloxscripts.free/1.0", Accept: "application/json" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function getPlaceThumbnail(placeId: string): Promise<string | null> {
  const map = await getPlaceThumbnails([placeId]);
  return map.get(placeId) || null;
}

/** Batch-fetch place thumbnails (cached ~1h via fetch revalidate). */
export async function getPlaceThumbnails(placeIds: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(placeIds.map((id) => String(id || "").trim()).filter(Boolean))];
  const out = new Map<string, string>();
  const chunkSize = 50;

  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const data = await fetchJson<{
      data?: Array<{ targetId?: number | string; imageUrl?: string }>;
    }>(
      `https://thumbnails.roblox.com/v1/places/gameicons?placeIds=${chunk
        .map(encodeURIComponent)
        .join(",")}&returnPolicy=PlaceHolder&size=512x512&format=Png&isCircular=false`
    );

    for (const item of data?.data || []) {
      if (item?.imageUrl && item.targetId != null) {
        out.set(String(item.targetId), item.imageUrl);
      }
    }
  }

  return out;
}

export async function getPlaceName(placeId: string): Promise<string | null> {
  const universe = await fetchJson<{ universeId?: number }>(
    `https://apis.roblox.com/universes/v1/places/${encodeURIComponent(placeId)}/universe`
  );
  if (!universe?.universeId) return null;

  const games = await fetchJson<{
    data?: Array<{ name?: string }>;
  }>(`https://games.roblox.com/v1/games?universeIds=${universe.universeId}`);

  const name = games?.data?.[0]?.name?.trim();
  return name || null;
}

/** Resolve thumbnail + optional name for a place ID. */
export async function resolveRobloxGame(
  placeId: string,
  opts?: { fetchName?: boolean }
): Promise<RobloxGameInfo> {
  const [thumbnailUrl, name] = await Promise.all([
    getPlaceThumbnail(placeId),
    opts?.fetchName ? getPlaceName(placeId) : Promise.resolve(null),
  ]);

  return {
    placeId,
    name,
    thumbnailUrl,
    playUrl: robloxGameUrl(placeId),
  };
}
