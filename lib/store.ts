import fs from "fs";
import path from "path";

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

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "scripts.json");

export const MAX_CODE = 500_000; // ~500 KB

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]", "utf8");
}

export function readScripts(): ScriptRecord[] {
  ensureStore();
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) as ScriptRecord[];
  } catch {
    return [];
  }
}

export function writeScripts(scripts: ScriptRecord[]) {
  ensureStore();
  fs.writeFileSync(DATA_FILE, JSON.stringify(scripts, null, 2), "utf8");
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
    size: s.code ? Buffer.byteLength(s.code, "utf8") : 0,
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
