import { getAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ScriptRecord = {
  id: string;
  title: string;
  description: string;
  author: string;
  game: string;
  tags: string[];
  code: string;
  views: number;
  copies: number;
  createdAt: string;
  userId?: string | null;
};

export type ScriptView = Omit<ScriptRecord, "code"> & {
  lines: number;
  size: number;
  code?: string;
};

type ScriptRow = {
  id: string;
  title: string;
  description: string | null;
  author: string | null;
  game: string | null;
  tags: string[] | null;
  code: string;
  views: number | null;
  copies: number | null;
  created_at: string;
  user_id?: string | null;
};

export const MAX_CODE = 500_000; // ~500 KB

function fromRow(row: ScriptRow): ScriptRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description || "",
    author: row.author || "Anonymous",
    game: row.game || "",
    tags: row.tags || [],
    code: row.code,
    views: row.views || 0,
    copies: row.copies || 0,
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
    tags: s.tags,
    code: s.code,
    views: s.views,
    copies: s.copies,
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
    tags: s.tags,
    views: s.views,
    copies: s.copies,
    createdAt: s.createdAt,
    userId: s.userId,
    lines: s.code ? s.code.split("\n").length : 0,
    size: s.code ? new TextEncoder().encode(s.code).length : 0,
  };
  if (includeCode) view.code = s.code;
  return view;
}

export function sanitizeTags(raw: unknown): string[] {
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : String(raw).split(",");
  return arr
    .map((t) => String(t).trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 8);
}

function sortAndFilter(
  scripts: ScriptRecord[],
  opts?: { q?: string; sort?: string }
): ScriptRecord[] {
  let list = scripts;
  const q = (opts?.q || "").trim().toLowerCase();
  const sort = opts?.sort || "new";

  if (q) {
    list = list.filter((s) => {
      const hay = [s.title, s.description, s.author, s.game, (s.tags || []).join(" ")]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }

  if (sort === "popular") list.sort((a, b) => (b.views || 0) - (a.views || 0));
  else if (sort === "copies") list.sort((a, b) => (b.copies || 0) - (a.copies || 0));
  else list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  return list;
}

export async function listScripts(opts?: {
  q?: string;
  sort?: string;
  userId?: string;
}): Promise<ScriptRecord[]> {
  const supabase = getAdminClient();
  let query = supabase.from("scripts").select("*");
  if (opts?.userId) query = query.eq("user_id", opts.userId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return sortAndFilter(((data || []) as ScriptRow[]).map(fromRow), opts);
}

export async function getScript(id: string): Promise<ScriptRecord | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase.from("scripts").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? fromRow(data as ScriptRow) : null;
}

/** Insert with the caller's session client so RLS can enforce user_id = auth.uid() */
export async function createScriptWithClient(
  client: SupabaseClient,
  record: ScriptRecord
): Promise<ScriptRecord> {
  const { data, error } = await client.from("scripts").insert(toRow(record)).select("*").single();
  if (error) throw new Error(error.message);
  return fromRow(data as ScriptRow);
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

export async function readScripts(): Promise<ScriptRecord[]> {
  return listScripts();
}
