import { getAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import { EXECUTORS } from "@/lib/executors";

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
  game?: string;
  tag?: string;
  executor?: string;
  verified?: boolean;
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
  const tag = (opts?.tag || "").trim().toLowerCase();
  const executor = (opts?.executor || "").trim().toLowerCase();

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

  if (game) {
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

  if (sort === "popular") list.sort((a, b) => (b.views || 0) - (a.views || 0));
  else if (sort === "copies") list.sort((a, b) => (b.copies || 0) - (a.copies || 0));
  else if (sort === "likes") list.sort((a, b) => (b.likes || 0) - (a.likes || 0));
  else list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

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
    // Column may be missing until community.sql is applied
    if (/executors/i.test(error.message)) {
      const { executors: _drop, ...without } = row;
      const retry = await client.from("scripts").insert(without).select("*").single();
      if (retry.error) throw new Error(retry.error.message);
      return fromRow(retry.data as ScriptRow);
    }
    throw new Error(error.message);
  }
  return fromRow(data as ScriptRow);
}

export async function updateScriptWithClient(
  client: SupabaseClient,
  id: string,
  patch: Partial<ScriptRecord>
): Promise<ScriptRecord> {
  const updates: Record<string, unknown> = {};
  if (patch.title != null) updates.title = patch.title;
  if (patch.description != null) updates.description = patch.description;
  if (patch.game != null) updates.game = patch.game;
  if (patch.gamePlaceId !== undefined) updates.game_place_id = patch.gamePlaceId;
  if (patch.tags != null) updates.tags = patch.tags;
  if (patch.executors != null) updates.executors = patch.executors;
  if (patch.code != null) updates.code = patch.code;

  const { data, error } = await client
    .from("scripts")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    if (/executors/i.test(error.message) && updates.executors != null) {
      const { executors: _drop, ...without } = updates;
      const retry = await client
        .from("scripts")
        .update(without)
        .eq("id", id)
        .select("*")
        .single();
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
