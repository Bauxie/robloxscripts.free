import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import {
  readScripts,
  writeScripts,
  publicView,
  sanitizeTags,
  MAX_CODE,
  type ScriptRecord,
} from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/scripts?q=&sort=
export function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim().toLowerCase();
  const sort = req.nextUrl.searchParams.get("sort") || "new";
  let scripts = readScripts();

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

  return NextResponse.json(scripts.map((s) => publicView(s)));
}

// POST /api/scripts  (JSON or multipart form-data)
export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  let title = "";
  let description = "";
  let author = "";
  let game = "";
  let tagsRaw: unknown = "";
  let code = "";

  try {
    if (contentType.includes("application/json")) {
      const body = await req.json();
      title = (body.title || "").toString();
      description = (body.description || "").toString();
      author = (body.author || "").toString();
      game = (body.game || "").toString();
      tagsRaw = body.tags;
      code = (body.code || "").toString();
    } else {
      const form = await req.formData();
      title = (form.get("title") || "").toString();
      description = (form.get("description") || "").toString();
      author = (form.get("author") || "").toString();
      game = (form.get("game") || "").toString();
      tagsRaw = form.get("tags");
      code = (form.get("code") || "").toString();
      const file = form.get("file");
      if (file && typeof file !== "string") {
        code = Buffer.from(await file.arrayBuffer()).toString("utf8");
      }
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  title = title.trim();
  description = description.trim().slice(0, 2000);
  author = author.trim().slice(0, 60) || "Anonymous";
  game = game.trim().slice(0, 80);
  const tags = sanitizeTags(tagsRaw);

  if (!title) return NextResponse.json({ error: "A title is required." }, { status: 400 });
  if (!code.trim())
    return NextResponse.json({ error: "Script code is required." }, { status: 400 });
  if (code.length > MAX_CODE)
    return NextResponse.json({ error: "Script is too large (max 500 KB)." }, { status: 400 });

  const scripts = readScripts();
  const record: ScriptRecord = {
    id: nanoid(10),
    title: title.slice(0, 120),
    description,
    author,
    game,
    tags,
    code,
    views: 0,
    copies: 0,
    createdAt: new Date().toISOString(),
  };
  scripts.push(record);
  writeScripts(scripts);

  return NextResponse.json(publicView(record, true), { status: 201 });
}
