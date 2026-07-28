import { NextRequest, NextResponse } from "next/server";
import {
  SOCIAL_PLATFORMS,
  normalizeSocialLink,
  type SocialPlatform,
} from "@/lib/profile";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

/**
 * GET /api/social/stats?platform=github&v=<stored value>
 *
 * Returns public stats for a linked social account (subscribers, followers…).
 * SSRF-safe: the value is re-validated through normalizeSocialLink, and every
 * outbound request goes to a hard-coded API host — never a user-supplied URL.
 */

type Stat = { label: string; value: number | string };
type StatsPayload = { title?: string; stats: Stat[] };

const TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { exp: number; payload: StatsPayload }>();

function getCached(key: string): StatsPayload | null {
  const hit = cache.get(key);
  if (hit && hit.exp > Date.now()) return hit.payload;
  if (hit) cache.delete(key);
  return null;
}

function setCached(key: string, payload: StatsPayload) {
  if (cache.size > 500) cache.clear();
  cache.set(key, { exp: Date.now() + TTL_MS, payload });
}

async function apiFetch(url: string, init?: RequestInit): Promise<Response | null> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        "User-Agent": "robloxscripts.free (social stats)",
        Accept: "application/json",
        ...(init?.headers || {}),
      },
      next: { revalidate: 600 },
    });
    clearTimeout(t);
    return res;
  } catch {
    return null;
  }
}

/** Fetch a public page's HTML (uncached — large pages; we cache the parsed result). */
async function scrapeHtml(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    clearTimeout(t);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function metaContent(html: string, property: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
    "i"
  );
  const alt = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
    "i"
  );
  const m = html.match(re) || html.match(alt);
  return m ? decodeEntities(m[1]) : null;
}

/** First "<number><K/M/B>? <word>" occurrence, e.g. "1.23M subscribers". */
function countBefore(html: string, word: string): string | null {
  const m = html.match(new RegExp(`([\\d][\\d.,]*\\s*[KMB]?)\\s*${word}`, "i"));
  return m ? m[1].replace(/\s+/g, "") : null;
}

async function githubStats(canonical: string): Promise<StatsPayload> {
  const user = new URL(canonical).pathname.split("/").filter(Boolean)[0];
  if (!user) return { stats: [] };
  const res = await apiFetch(`https://api.github.com/users/${encodeURIComponent(user)}`);
  if (!res?.ok) return { stats: [] };
  const d = (await res.json()) as Record<string, unknown>;
  return {
    title: typeof d.name === "string" && d.name ? d.name : String(d.login || user),
    stats: [
      { label: "Followers", value: Number(d.followers) || 0 },
      { label: "Repos", value: Number(d.public_repos) || 0 },
    ],
  };
}

async function gitlabStats(canonical: string): Promise<StatsPayload> {
  const user = new URL(canonical).pathname.split("/").filter(Boolean)[0];
  if (!user) return { stats: [] };
  const res = await apiFetch(
    `https://gitlab.com/api/v4/users?username=${encodeURIComponent(user)}`
  );
  if (!res?.ok) return { stats: [] };
  const list = (await res.json()) as Array<Record<string, unknown>>;
  const found = list?.[0];
  if (!found?.id) return { stats: [] };
  const stats: Stat[] = [];
  const fRes = await apiFetch(
    `https://gitlab.com/api/v4/users/${Number(found.id)}/followers?per_page=1`
  );
  const total = fRes?.headers.get("x-total");
  if (total != null) stats.push({ label: "Followers", value: Number(total) || 0 });
  return { title: String(found.name || found.username || user), stats };
}

async function robloxStats(canonical: string): Promise<StatsPayload> {
  const m = new URL(canonical).pathname.match(/^\/users\/(\d+)/);
  if (!m) return { stats: [] };
  const id = m[1];
  const [uRes, fRes, frRes] = await Promise.all([
    apiFetch(`https://users.roblox.com/v1/users/${id}`),
    apiFetch(`https://friends.roblox.com/v1/users/${id}/followers/count`),
    apiFetch(`https://friends.roblox.com/v1/users/${id}/friends/count`),
  ]);
  const stats: Stat[] = [];
  let title: string | undefined;
  if (uRes?.ok) {
    const d = (await uRes.json()) as Record<string, unknown>;
    title = String(d.displayName || d.name || "");
  }
  if (fRes?.ok) {
    const d = (await fRes.json()) as Record<string, unknown>;
    stats.push({ label: "Followers", value: Number(d.count) || 0 });
  }
  if (frRes?.ok) {
    const d = (await frRes.json()) as Record<string, unknown>;
    stats.push({ label: "Friends", value: Number(d.count) || 0 });
  }
  return { title, stats };
}

async function discordStats(canonical: string): Promise<StatsPayload> {
  if (!canonical.startsWith("https://")) {
    return { stats: [] }; // plain username — nothing public to fetch
  }
  const u = new URL(canonical);
  let code = "";
  if (u.hostname === "discord.gg") code = u.pathname.split("/").filter(Boolean)[0] || "";
  else {
    const m = u.pathname.match(/^\/invite\/([^/]+)/);
    code = m?.[1] || "";
  }
  if (!code || !/^[a-zA-Z0-9-]{2,32}$/.test(code)) return { stats: [] };
  const res = await apiFetch(
    `https://discord.com/api/v10/invites/${encodeURIComponent(code)}?with_counts=true`
  );
  if (!res?.ok) return { stats: [] };
  const d = (await res.json()) as Record<string, unknown>;
  const guild = d.guild as Record<string, unknown> | undefined;
  return {
    title: guild?.name ? String(guild.name) : undefined,
    stats: [
      { label: "Members", value: Number(d.approximate_member_count) || 0 },
      { label: "Online", value: Number(d.approximate_presence_count) || 0 },
    ],
  };
}

async function youtubeScrape(canonical: string): Promise<StatsPayload> {
  const path = new URL(canonical).pathname;
  const html = await scrapeHtml(`https://www.youtube.com${path}`);
  if (!html) return { stats: [] };
  const stats: Stat[] = [];
  const subs = countBefore(html, "subscribers");
  const videos = countBefore(html, "videos");
  if (subs) stats.push({ label: "Subscribers", value: subs });
  if (videos) stats.push({ label: "Videos", value: videos });
  return { title: metaContent(html, "og:title") || undefined, stats };
}

async function youtubeStats(canonical: string): Promise<StatsPayload> {
  const key = (process.env.YOUTUBE_API_KEY || "").trim();
  if (!key) return youtubeScrape(canonical);
  const path = new URL(canonical).pathname;
  const params = new URLSearchParams({ part: "statistics,snippet", key });
  const handle = path.match(/^\/@([^/]+)/)?.[1];
  const channelId = path.match(/^\/channel\/(UC[a-zA-Z0-9_-]{10,})/)?.[1];
  if (handle) params.set("forHandle", `@${handle}`);
  else if (channelId) params.set("id", channelId);
  else return youtubeScrape(canonical);
  const res = await apiFetch(`https://www.googleapis.com/youtube/v3/channels?${params}`);
  if (!res?.ok) return youtubeScrape(canonical);
  const d = (await res.json()) as {
    items?: Array<{
      snippet?: { title?: string };
      statistics?: { subscriberCount?: string; videoCount?: string };
    }>;
  };
  const item = d.items?.[0];
  if (!item) return youtubeScrape(canonical);
  return {
    title: item.snippet?.title,
    stats: [
      { label: "Subscribers", value: Number(item.statistics?.subscriberCount) || 0 },
      { label: "Videos", value: Number(item.statistics?.videoCount) || 0 },
    ],
  };
}

let spotifyToken: { token: string; exp: number } | null = null;

async function getSpotifyToken(): Promise<string | null> {
  const id = (process.env.SPOTIFY_CLIENT_ID || "").trim();
  const secret = (process.env.SPOTIFY_CLIENT_SECRET || "").trim();
  if (!id || !secret) return null;
  if (spotifyToken && spotifyToken.exp > Date.now()) return spotifyToken.token;
  const res = await apiFetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res?.ok) return null;
  const d = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!d.access_token) return null;
  spotifyToken = {
    token: d.access_token,
    exp: Date.now() + Math.max(60, (d.expires_in || 3600) - 60) * 1000,
  };
  return spotifyToken.token;
}

async function spotifyScrape(canonical: string): Promise<StatsPayload> {
  const m = new URL(canonical).pathname.match(/^\/user\/([^/]+)/);
  if (!m) return { stats: [] };
  const html = await scrapeHtml(`https://open.spotify.com/user/${m[1]}`);
  if (!html) return { stats: [] };
  const stats: Stat[] = [];
  // Follower count appears in og:description ("… · N Followers") and page body
  const followers =
    countBefore(metaContent(html, "og:description") || "", "Followers") ||
    countBefore(html, "Followers");
  if (followers) stats.push({ label: "Followers", value: followers });
  const title = metaContent(html, "og:title");
  return { title: title || undefined, stats };
}

async function spotifyStats(canonical: string): Promise<StatsPayload> {
  const token = await getSpotifyToken();
  if (!token) return spotifyScrape(canonical);
  const m = new URL(canonical).pathname.match(/^\/user\/([^/]+)/);
  if (!m) return { stats: [] };
  const res = await apiFetch(`https://api.spotify.com/v1/users/${m[1]}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res?.ok) return spotifyScrape(canonical);
  const d = (await res.json()) as {
    display_name?: string;
    followers?: { total?: number };
  };
  return {
    title: d.display_name,
    stats: [{ label: "Followers", value: Number(d.followers?.total) || 0 }],
  };
}

const FETCHERS: Record<SocialPlatform, (canonical: string) => Promise<StatsPayload>> = {
  github: githubStats,
  gitlab: gitlabStats,
  roblox: robloxStats,
  discord: discordStats,
  youtube: youtubeStats,
  spotify: spotifyStats,
};

export async function GET(req: NextRequest) {
  const platform = req.nextUrl.searchParams.get("platform") as SocialPlatform | null;
  const value = req.nextUrl.searchParams.get("v") || "";

  if (!platform || !SOCIAL_PLATFORMS.includes(platform)) {
    return NextResponse.json({ error: "Unknown platform" }, { status: 400 });
  }

  // Re-validate: only canonical, allowlisted values ever reach a fetcher.
  const { value: canonical, error } = normalizeSocialLink(platform, value);
  if (error || !canonical) {
    return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  }

  const cacheKey = `${platform}:${canonical}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" },
    });
  }

  const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  const rl = await rateLimit({ key: `social-stats:${ip}`, limit: 60, windowSeconds: 300 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const payload = await FETCHERS[platform](canonical).catch(
    (): StatsPayload => ({ stats: [] })
  );
  setCached(cacheKey, payload);

  return NextResponse.json(payload, {
    headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" },
  });
}
