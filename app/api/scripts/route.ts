import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import {
  listScripts,
  createScriptWithClient,
  publicView,
  sanitizeTags,
  MAX_CODE,
  type ScriptRecord,
} from "@/lib/store";
import { getSupabaseConfigError } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

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

// POST /api/scripts — requires login
export async function POST(req: NextRequest) {
  try {
    const configError = getSupabaseConfigError();
    if (configError) return fail(configError, 500);

    const supabase = createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("You must be logged in to upload.", 401);

    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();

    const author =
      (profile?.username as string | undefined)?.trim() ||
      user.email?.split("@")[0] ||
      "Anonymous";

    const contentType = req.headers.get("content-type") || "";
    let title = "";
    let description = "";
    let game = "";
    let tagsRaw: unknown = "";
    let code = "";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      title = (body.title || "").toString();
      description = (body.description || "").toString();
      game = (body.game || "").toString();
      tagsRaw = body.tags;
      code = (body.code || "").toString();
    } else {
      const form = await req.formData();
      title = (form.get("title") || "").toString();
      description = (form.get("description") || "").toString();
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
    game = game.trim().slice(0, 80);
    const tags = sanitizeTags(tagsRaw);

    if (!title) return fail("A title is required.", 400);
    if (!code.trim()) return fail("Script code is required.", 400);
    if (code.length > MAX_CODE) return fail("Script is too large (max 500 KB).", 400);

    const record: ScriptRecord = {
      id: nanoid(10),
      title: title.slice(0, 120),
      description,
      author: author.slice(0, 60),
      game,
      tags,
      code,
      views: 0,
      copies: 0,
      createdAt: new Date().toISOString(),
      userId: user.id,
    };

    const saved = await createScriptWithClient(supabase, record);
    return NextResponse.json(publicView(saved, true), { status: 201 });
  } catch (e) {
    return fail(e);
  }
}
