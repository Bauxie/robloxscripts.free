import { getSupabase } from "@/lib/supabase";

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

export async function listScripts(opts?: {
  q?: string;
  sort?: string;
}): Promise<ScriptRecord[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("scripts").select("*");
  if (error) throw new Error(error.message);

  let scripts = ((data || []) as ScriptRow[]).map(fromRow);
  const q = (opts?.q || "").trim().toLowerCase();
  const sort = opts?.sort || "new";

  if (q) {
    scripts = scripts.filter((s) => {
      const hay = [s.title, s.description, s.author, s.game, (s.tags || []).join(" ")]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }

  if (sort === "popular") scripts.sort((a, b) => (b.views || 0) - (a.views || 0));
  else if (sort === "copies") scripts.sort((a, b) => (b.copies || 0) - (a.copies || 0));
  else scripts.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  return scripts;
}

export async function getScript(id: string): Promise<ScriptRecord | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("scripts").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? fromRow(data as ScriptRow) : null;
}

export async function createScript(record: ScriptRecord): Promise<ScriptRecord> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("scripts")
    .insert(toRow(record))
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return fromRow(data as ScriptRow);
}

export async function incrementViews(id: string): Promise<ScriptRecord | null> {
  const supabase = getSupabase();
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
  const supabase = getSupabase();
  const current = await getScript(id);
  if (!current) return null;

  const next = (current.copies || 0) + 1;
  const { error } = await supabase.from("scripts").update({ copies: next }).eq("id", id);
  if (error) throw new Error(error.message);
  return next;
}

/** @deprecated use listScripts — kept name for gradual migration */
export async function readScripts(): Promise<ScriptRecord[]> {
  return listScripts();
}
