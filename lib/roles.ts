export const ROLE_IDS = [
  "owner",
  "admin",
  "moderator",
  "content_creator",
  "verified",
] as const;

export type RoleId = (typeof ROLE_IDS)[number];

export type RoleDef = {
  id: RoleId;
  label: string;
  description: string;
  color: string;
  bg: string;
};

export const ROLE_DEFS: Record<RoleId, RoleDef> = {
  owner: {
    id: "owner",
    label: "Owner",
    description: "Site owner — full control",
    color: "#7a2e00",
    bg: "#ffd166",
  },
  admin: {
    id: "admin",
    label: "Admin",
    description: "Administrator — can manage roles",
    color: "#e11d2e",
    bg: "#fff5f5",
  },
  moderator: {
    id: "moderator",
    label: "Moderator",
    description: "Moderator — helps keep the shore clean",
    color: "#2f6fed",
    bg: "#f0f6ff",
  },
  content_creator: {
    id: "content_creator",
    label: "Content Creator",
    description: "Content Creator — makes scripts & media",
    color: "#ffffff",
    bg: "#ff0033",
  },
  verified: {
    id: "verified",
    label: "Verified User",
    description: "Verified User — trusted uploader",
    color: "#fff",
    bg: "#3d8ef0",
  },
};

const RANK: Record<RoleId, number> = {
  owner: 100,
  admin: 80,
  moderator: 60,
  content_creator: 40,
  verified: 20,
};

export function isRoleId(value: string): value is RoleId {
  return (ROLE_IDS as readonly string[]).includes(value);
}

export function normalizeRoles(raw: unknown): RoleId[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<RoleId>();
  const out: RoleId[] = [];
  for (const item of raw) {
    const id = String(item || "").trim().toLowerCase();
    if (!isRoleId(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out.sort((a, b) => RANK[b] - RANK[a]);
}

export function roleDefsFor(roles: RoleId[]): RoleDef[] {
  return normalizeRoles(roles).map((id) => ROLE_DEFS[id]);
}

export function canManageRoles(roles: RoleId[]): boolean {
  return roles.includes("owner") || roles.includes("admin");
}

export function canModerate(roles: RoleId[]): boolean {
  return (
    roles.includes("owner") ||
    roles.includes("admin") ||
    roles.includes("moderator")
  );
}

/** Admins cannot grant/revoke owner unless they are owner. */
export function canAssignRole(actorRoles: RoleId[], targetRole: RoleId): boolean {
  if (!canManageRoles(actorRoles)) return false;
  if (targetRole === "owner") return actorRoles.includes("owner");
  return true;
}

export function getBootstrapOwnerUsernames(): string[] {
  return (process.env.SITE_OWNER_USERNAMES || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function getBootstrapOwnerIds(): string[] {
  return (process.env.SITE_OWNER_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function withBootstrapOwner(
  profile: { id: string; username: string; roles?: RoleId[] | null },
  roles: RoleId[]
): RoleId[] {
  const next = [...roles];
  const owners = getBootstrapOwnerUsernames();
  const ownerIds = getBootstrapOwnerIds();
  const isOwner =
    ownerIds.includes(profile.id) || owners.includes(profile.username.toLowerCase());
  if (isOwner && !next.includes("owner")) next.push("owner");
  return normalizeRoles(next);
}
