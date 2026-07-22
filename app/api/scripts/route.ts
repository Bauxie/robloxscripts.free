import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import {
  listScripts,
  createScript,
  publicView,
  sanitizeTags,
  MAX_CODE,
  type ScriptRecord,
} from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/scripts?q=&sort=
export async function GET(req: NextRequest) {
  try {
    const q = (req.nextUrl.searchParams.get("q") || "").trim().toLowerCase();
    const sort = req.nextUrl.searchParams.get("sort") || "new";
    const scripts = await listScripts({ q, sort });
    return NextResponse.json(scripts.map((s) => publicView(s)));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
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

  try {
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
    const saved = await createScript(record);
    return NextResponse.json(publicView(saved, true), { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
