import { getAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import { EXECUTORS } from "@/lib/executors";
import { gameMatchesSlug, slugifyGame } from "@/lib/games";

export type ScriptRecord = {
  id: string;
  title: string;
  description: string;
  author: string;
  game: string;
  gamePlaceId: string | null;
  tags: string[];
  executors: string[];
  code: string;
  views: number;
  copies: number;
  likes: number;
  createdAt: string;
  updatedAt: string;
  changelog: string;
  version: number;
  versionGroup: string;
  featured: boolean;
  staffVerified: boolean;
  worksCount: number;
  brokenCount: number;
  userId?: string | null;
};

export type ScriptView = Omit<ScriptRecord, "code"> & {
  lines: number;
  size: number;
  code?: string;
  thumbnailUrl?: string | null;
  authorAvatar?: string | null;
  authorRoles?: import("@/lib/roles").RoleId[];
};

type ScriptRow = {
  id: string;
  title: string;
  description: string | null;
  author: string | null;
  game: string | null;
  game_place_id?: string | null;
  tags: string[] | null;
  executors?: string[] | null;
  code: string;
  views: number | null;
  copies: number | null;
  likes?: number | null;
  created_at: string;
  updated_at?: string | null;
  changelog?: string | null;
  version?: number | null;
  version_group?: string | null;
  featured?: boolean | null;
  staff_verified?: boolean | null;
  works_count?: number | null;
  broken_count?: number | null;
  user_id?: string | null;
};

export const MAX_CODE = 500_000;

const EXECUTOR_IDS = new Set(EXECUTORS.map((e) => e.id));

export function sanitizeExecutors(raw: unknown): string[] {
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : String(raw).split(",");
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of arr) {
    const id = String(item || "").trim().toLowerCase();
    if (!id || !EXECUTOR_IDS.has(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out.slice(0, 8);
}

function fromRow(row: ScriptRow): ScriptRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description || "",
    author: row.author || "Anonymous",
    game: row.game || "",
    gamePlaceId: row.game_place_id || null,
    tags: row.tags || [],
    executors: row.executors || [],
    code: row.code,
    views: row.views || 0,
    copies: row.copies || 0,
    likes: row.likes || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
    changelog: row.changelog || "",
    version: row.version || 1,
    versionGroup: row.version_group || row.id,
    featured: Boolean(row.featured),
    staffVerified: Boolean(row.staff_verified),
    worksCount: row.works_count || 0,
    brokenCount: row.broken_count || 0,
    userId: row.user_id ?? null,
  };
}

function toRow(s: ScriptRecord) {
  return {
    id: s.id,
    title: s.title,
    description: s.description,
    author: s.author,
    game: s.game,
    game_place_id: s.gamePlaceId,
    tags: s.tags,
    executors: s.executors,
    code: s.code,
    views: s.views,
    copies: s.copies,
    likes: s.likes,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
    changelog: s.changelog,
    version: s.version,
    version_group: s.versionGroup || s.id,
    featured: s.featured,
    staff_verified: s.staffVerified,
    works_count: s.worksCount,
    broken_count: s.brokenCount,
    user_id: s.userId ?? null,
  };
}

export function publicView(s: ScriptRecord, includeCode = false): ScriptView {
  const view: ScriptView = {
    id: s.id,
    title: s.title,
    description: s.description,
    author: s.author,
    game: s.game,
    gamePlaceId: s.gamePlaceId,
    tags: s.tags,
    executors: s.executors,
    views: s.views,
    copies: s.copies,
    likes: s.likes,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    changelog: s.changelog,
    version: s.version,
    versionGroup: s.versionGroup,
    featured: s.featured,
    staffVerified: s.staffVerified,
    worksCount: s.worksCount,
    brokenCount: s.brokenCount,
    userId: s.userId,
    lines: s.code ? s.code.split("\n").length : 0,
    size: s.code ? new TextEncoder().encode(s.code).length : 0,
  };
  if (includeCode) view.code = s.code;
  return view;
}

export function sanitizeTags(raw: unknown, gameName?: string): string[] {
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : String(raw).split(",");
  const game = (gameName || "").trim().toLowerCase();
  const gameCompact = game.replace(/[^a-z0-9]+/g, "");

  return arr
    .map((t) => String(t).trim().toLowerCase().replace(/\s+/g, " "))
    .filter(Boolean)
    .filter((t) => {
      if (!gameCompact) return true;
      const compact = t.replace(/[^a-z0-9]+/g, "");
      if (compact === gameCompact) return false;
      if (compact.startsWith(gameCompact) && compact.endsWith("script")) return false;
      if (t === `${game} script`) return false;
      return true;
    })
    .slice(0, 8);
}

export type ListScriptsOpts = {
  q?: string;
  sort?: string;
  userId?: string;
  userIds?: string[];
  game?: string;
  gameSlug?: string;
  tag?: string;
  executor?: string;
  verified?: boolean;
  staffVerified?: boolean;
  featured?: boolean;
  ids?: string[];
};

function sortAndFilter(
  scripts: ScriptRecord[],
  opts?: ListScriptsOpts,
  verifiedUserIds?: Set<string>
): ScriptRecord[] {
  let list = scripts;
  const q = (opts?.q || "").trim().toLowerCase();
  const sort = opts?.sort || "new";
  const game = (opts?.game || "").trim().toLowerCase();
  const gameSlug = (opts?.gameSlug || "").trim().toLowerCase();
  const tag = (opts?.tag || "").trim().toLowerCase();
  const executor = (opts?.executor || "").trim().toLowerCase();

  if (opts?.ids?.length) {
    const set = new Set(opts.ids);
    list = list.filter((s) => set.has(s.id));
  }
  if (opts?.userIds?.length) {
    const set = new Set(opts.userIds);
    list = list.filter((s) => s.userId && set.has(s.userId));
  }

  if (q) {
    list = list.filter((s) => {
      const hay = [
        s.title,
        s.description,
        s.author,
        s.game,
        (s.tags || []).join(" "),
        (s.executors || []).join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }

  if (gameSlug) {
    list = list.filter((s) => gameMatchesSlug(s.game, gameSlug));
  } else if (game) {
    list = list.filter((s) => (s.game || "").toLowerCase().includes(game));
  }
  if (tag) {
    list = list.filter((s) => (s.tags || []).some((t) => t === tag || t.includes(tag)));
  }
  if (executor) {
    list = list.filter((s) => (s.executors || []).includes(executor));
  }
  if (opts?.verified && verifiedUserIds) {
    list = list.filter((s) => s.userId && verifiedUserIds.has(s.userId));
  }
  if (opts?.staffVerified) {
    list = list.filter((s) => s.staffVerified);
  }
  if (opts?.featured) {
    list = list.filter((s) => s.featured);
  }

  if (sort === "popular") list.sort((a, b) => (b.views || 0) - (a.views || 0));
  else if (sort === "copies") list.sort((a, b) => (b.copies || 0) - (a.copies || 0));
  else if (sort === "likes") list.sort((a, b) => (b.likes || 0) - (a.likes || 0));
  else if (sort === "updated") {
    list.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  } else list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  return list;
}

export async function listScripts(opts?: ListScriptsOpts): Promise<ScriptRecord[]> {
  const supabase = getAdminClient();
  let query = supabase.from("scripts").select("*");
  if (opts?.userId) query = query.eq("user_id", opts.userId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let verifiedUserIds: Set<string> | undefined;
  if (opts?.verified) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, roles")
      .contains("roles", ["verified"]);
    verifiedUserIds = new Set((profiles || []).map((p) => p.id as string));
  }

  return sortAndFilter(((data || []) as ScriptRow[]).map(fromRow), opts, verifiedUserIds);
}

export async function listGameSlugs(): Promise<{ slug: string; name: string; count: number }[]> {
  const scripts = await listScripts({ sort: "new" });
  const map = new Map<string, { name: string; count: number }>();
  for (const s of scripts) {
    const name = (s.game || "").trim();
    if (!name) continue;
    const slug = slugifyGame(name);
    if (!slug) continue;
    const cur = map.get(slug);
    if (cur) cur.count += 1;
    else map.set(slug, { name, count: 1 });
  }
  return [...map.entries()]
    .map(([slug, v]) => ({ slug, name: v.name, count: v.count }))
    .sort((a, b) => b.count - a.count);
}

export async function getScript(id: string): Promise<ScriptRecord | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase.from("scripts").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? fromRow(data as ScriptRow) : null;
}

export async function createScriptWithClient(
  client: SupabaseClient,
  record: ScriptRecord
): Promise<ScriptRecord> {
  const row = toRow(record);
  const { data, error } = await client.from("scripts").insert(row).select("*").single();
  if (error) {
    if (/executors|updated_at|changelog|version|featured|staff_verified|works_count/i.test(error.message)) {
      const fallback = {
        id: row.id,
        title: row.title,
        description: row.description,
        author: row.author,
        game: row.game,
        game_place_id: row.game_place_id,
        tags: row.tags,
        executors: row.executors,
        code: row.code,
        views: row.views,
        copies: row.copies,
        likes: row.likes,
        created_at: row.created_at,
        user_id: row.user_id,
      };
      const retry = await client.from("scripts").insert(fallback).select("*").single();
      if (retry.error) {
        const { executors: _e, ...withoutEx } = fallback;
        const retry2 = await client.from("scripts").insert(withoutEx).select("*").single();
        if (retry2.error) throw new Error(retry2.error.message);
        return fromRow(retry2.data as ScriptRow);
      }
      return fromRow(retry.data as ScriptRow);
    }
    throw new Error(error.message);
  }
  return fromRow(data as ScriptRow);
}

export async function updateScriptWithClient(
  client: SupabaseClient,
  id: string,
  patch: Partial<ScriptRecord> & { bumpVersion?: boolean }
): Promise<ScriptRecord> {
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.title != null) updates.title = patch.title;
  if (patch.description != null) updates.description = patch.description;
  if (patch.game != null) updates.game = patch.game;
  if (patch.gamePlaceId !== undefined) updates.game_place_id = patch.gamePlaceId;
  if (patch.tags != null) updates.tags = patch.tags;
  if (patch.executors != null) updates.executors = patch.executors;
  if (patch.code != null) updates.code = patch.code;
  if (patch.changelog != null) updates.changelog = patch.changelog;
  if (patch.version != null) updates.version = patch.version;

  const { data, error } = await client
    .from("scripts")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    if (/executors|updated_at|changelog|version/i.test(error.message)) {
      const soft: Record<string, unknown> = {};
      if (patch.title != null) soft.title = patch.title;
      if (patch.description != null) soft.description = patch.description;
      if (patch.game != null) soft.game = patch.game;
      if (patch.gamePlaceId !== undefined) soft.game_place_id = patch.gamePlaceId;
      if (patch.tags != null) soft.tags = patch.tags;
      if (patch.executors != null) soft.executors = patch.executors;
      if (patch.code != null) soft.code = patch.code;
      const retry = await client.from("scripts").update(soft).eq("id", id).select("*").single();
      if (retry.error) throw new Error(retry.error.message);
      return fromRow(retry.data as ScriptRow);
    }
    throw new Error(error.message);
  }
  return fromRow(data as ScriptRow);
}

export async function deleteScriptWithClient(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from("scripts").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteScriptAdmin(id: string): Promise<void> {
  const { error } = await getAdminClient().from("scripts").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function createScript(record: ScriptRecord): Promise<ScriptRecord> {
  return createScriptWithClient(getAdminClient(), record);
}

export async function incrementViews(id: string): Promise<ScriptRecord | null> {
  const supabase = getAdminClient();
  const current = await getScript(id);
  if (!current) return null;

  const { data, error } = await supabase
    .from("scripts")
    .update({ views: (current.views || 0) + 1 })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return fromRow(data as ScriptRow);
}

export async function incrementCopies(id: string): Promise<number | null> {
  const supabase = getAdminClient();
  const current = await getScript(id);
  if (!current) return null;

  const next = (current.copies || 0) + 1;
  const { error } = await supabase.from("scripts").update({ copies: next }).eq("id", id);
  if (error) throw new Error(error.message);
  return next;
}

export async function incrementLikes(id: string): Promise<number | null> {
  const supabase = getAdminClient();
  const current = await getScript(id);
  if (!current) return null;

  const next = (current.likes || 0) + 1;
  const { error } = await supabase.from("scripts").update({ likes: next }).eq("id", id);
  if (error) throw new Error(error.message);
  return next;
}

export async function readScripts(): Promise<ScriptRecord[]> {
  return listScripts();
}

export async function getProfileByUsername(username: string) {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id, username, avatar_url, bio, created_at, roles")
    .ilike("username", username)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function setScriptStaffFlags(
  id: string,
  flags: { featured?: boolean; staffVerified?: boolean }
) {
  const updates: Record<string, unknown> = {};
  if (flags.featured != null) updates.featured = flags.featured;
  if (flags.staffVerified != null) updates.staff_verified = flags.staffVerified;
  const { data, error } = await getAdminClient()
    .from("scripts")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return fromRow(data as ScriptRow);
}
