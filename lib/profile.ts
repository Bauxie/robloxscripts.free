import type { RoleId } from "@/lib/roles";

export const USERNAME_COOLDOWN_DAYS = 7;

export type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string;
  created_at: string;
  username_changed_at: string | null;
  roles: RoleId[];
  social_links: SocialLinks;
};

// ---------------------------------------------------------------------------
// Social links
// ---------------------------------------------------------------------------

export const SOCIAL_PLATFORMS = [
  "discord",
  "youtube",
  "github",
  "gitlab",
  "roblox",
  "spotify",
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

/** Stored per-user map of platform -> canonical URL (or plain Discord username). */
export type SocialLinks = Partial<Record<SocialPlatform, string>>;

export const SOCIAL_PLATFORM_META: Record<
  SocialPlatform,
  { label: string; placeholder: string; hint: string }
> = {
  discord: {
    label: "Discord",
    placeholder: "username or discord.gg/invite",
    hint: "Username shows as text; invite links are clickable.",
  },
  youtube: {
    label: "YouTube",
    placeholder: "@handle or channel URL",
    hint: "",
  },
  github: { label: "GitHub", placeholder: "username", hint: "" },
  gitlab: { label: "GitLab", placeholder: "username", hint: "" },
  roblox: {
    label: "Roblox",
    placeholder: "profile URL or user ID",
    hint: "e.g. roblox.com/users/1234567/profile",
  },
  spotify: { label: "Spotify", placeholder: "profile URL or user ID", hint: "" },
};

export function parseSocialLinks(raw: unknown): SocialLinks {
  if (!raw || typeof raw !== "object") return {};
  const out: SocialLinks = {};
  for (const platform of SOCIAL_PLATFORMS) {
    const v = (raw as Record<string, unknown>)[platform];
    if (typeof v === "string" && v.trim()) out[platform] = v.trim().slice(0, 200);
  }
  return out;
}

const HANDLE_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9._-]{0,38})$/;

function stripUrl(raw: string): { host: string; path: string } | null {
  let s = raw.trim();
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    const u = new URL(s);
    return { host: u.hostname.toLowerCase().replace(/^www\./, ""), path: u.pathname };
  } catch {
    return null;
  }
}

/**
 * Normalize user input for a platform into the canonical stored value.
 * Returns { value } on success (empty string = cleared), or { error }.
 */
export function normalizeSocialLink(
  platform: SocialPlatform,
  raw: string
): { value?: string; error?: string } {
  const input = raw.trim();
  if (!input) return { value: "" };
  if (input.length > 200) return { error: "Link is too long." };
  const looksLikeUrl = input.includes("/") || input.includes(".");

  switch (platform) {
    case "github":
    case "gitlab": {
      const site = platform === "github" ? "github.com" : "gitlab.com";
      if (looksLikeUrl) {
        const u = stripUrl(input);
        const seg = u?.path.split("/").filter(Boolean)[0];
        if (!u || u.host !== site || !seg || !HANDLE_RE.test(seg)) {
          return { error: `Enter a ${site} username or profile URL.` };
        }
        return { value: `https://${site}/${seg}` };
      }
      if (!HANDLE_RE.test(input)) return { error: "That doesn't look like a valid username." };
      return { value: `https://${site}/${input}` };
    }

    case "youtube": {
      if (looksLikeUrl && !input.startsWith("@")) {
        const u = stripUrl(input);
        if (!u) return { error: "Enter a YouTube @handle or channel URL." };
        const ok = u.host === "youtube.com" || u.host === "youtu.be" || u.host === "m.youtube.com";
        if (!ok || !u.path || u.path === "/") {
          return { error: "Enter a YouTube @handle or channel URL." };
        }
        return { value: `https://youtube.com${u.path}` };
      }
      const handle = input.replace(/^@/, "");
      if (!HANDLE_RE.test(handle)) return { error: "Enter a YouTube @handle or channel URL." };
      return { value: `https://youtube.com/@${handle}` };
    }

    case "roblox": {
      if (/^\d{1,20}$/.test(input)) {
        return { value: `https://www.roblox.com/users/${input}/profile` };
      }
      const u = stripUrl(input);
      const m = u && u.host.endsWith("roblox.com") ? u.path.match(/^\/users\/(\d+)/) : null;
      if (!m) return { error: "Enter your Roblox user ID or profile URL." };
      return { value: `https://www.roblox.com/users/${m[1]}/profile` };
    }

    case "spotify": {
      if (looksLikeUrl) {
        const u = stripUrl(input);
        const m = u && u.host === "open.spotify.com" ? u.path.match(/^\/user\/([^/]+)/) : null;
        if (!m) return { error: "Enter your Spotify profile URL or user ID." };
        return { value: `https://open.spotify.com/user/${encodeURIComponent(decodeURIComponent(m[1]))}` };
      }
      if (!/^[a-zA-Z0-9._-]{1,64}$/.test(input)) {
        return { error: "Enter your Spotify profile URL or user ID." };
      }
      return { value: `https://open.spotify.com/user/${input}` };
    }

    case "discord": {
      if (looksLikeUrl) {
        const u = stripUrl(input);
        if (!u) return { error: "Enter a Discord username or discord.gg invite." };
        const invite =
          (u.host === "discord.gg" && u.path.length > 1) ||
          (u.host === "discord.com" && /^\/(invite|users)\//.test(u.path));
        if (!invite) return { error: "Enter a Discord username or discord.gg invite." };
        return { value: `https://${u.host}${u.path}` };
      }
      if (!/^[a-z0-9._]{2,32}$/.test(input.toLowerCase())) {
        return { error: "That doesn't look like a valid Discord username." };
      }
      return { value: input.toLowerCase() };
    }
  }
}

export function normalizeUsername(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 32);
}

export function validateUsername(username: string): string | null {
  if (username.length < 2 || username.length > 32) {
    return "Username must be 2–32 characters.";
  }
  if (!/^[a-z0-9_]+$/.test(username)) {
    return "Use only letters, numbers, and underscores.";
  }
  return null;
}

export function usernameCooldownRemaining(
  profile: Pick<Profile, "username_changed_at">,
  now = Date.now()
): number {
  if (!profile.username_changed_at) return 0;
  const changed = +new Date(profile.username_changed_at);
  const unlockAt = changed + USERNAME_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  return Math.max(0, unlockAt - now);
}

export function formatCooldown(ms: number): string {
  const days = Math.ceil(ms / (24 * 60 * 60 * 1000));
  if (days <= 1) {
    const hours = Math.ceil(ms / (60 * 60 * 1000));
    return hours <= 1 ? "about an hour" : `${hours} hours`;
  }
  return `${days} days`;
}
