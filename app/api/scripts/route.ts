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
import { getSupabaseConfigError } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : String(error);
  return NextResponse.json({ error: message }, { status });
}

// GET /api/scripts?q=&sort=
export async function GET(req: NextRequest) {
  try {
    const configError = getSupabaseConfigError();
    if (configError) return fail(configError, 500);

    const q = (req.nextUrl.searchParams.get("q") || "").trim().toLowerCase();
    const sort = req.nextUrl.searchParams.get("sort") || "new";
    const scripts = await listScripts({ q, sort });
    return NextResponse.json(scripts.map((s) => publicView(s)));
  } catch (e) {
    return fail(e);
  }
}

// POST /api/scripts  (JSON or multipart form-data)
export async function POST(req: NextRequest) {
  try {
    const configError = getSupabaseConfigError();
    if (configError) return fail(configError, 500);

    const contentType = req.headers.get("content-type") || "";
    let title = "";
    let description = "";
    let author = "";
    let game = "";
    let tagsRaw: unknown = "";
    let code = "";

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

    title = title.trim();
    description = description.trim().slice(0, 2000);
    author = author.trim().slice(0, 60) || "Anonymous";
    game = game.trim().slice(0, 80);
    const tags = sanitizeTags(tagsRaw);

    if (!title) return fail("A title is required.", 400);
    if (!code.trim()) return fail("Script code is required.", 400);
    if (code.length > MAX_CODE) return fail("Script is too large (max 500 KB).", 400);

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
    return fail(e);
  }
}
