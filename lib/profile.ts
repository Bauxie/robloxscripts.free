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
};

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
