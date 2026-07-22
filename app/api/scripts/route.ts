import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import {
  listScripts,
  createScriptWithClient,
  publicView,
  sanitizeTags,
  sanitizeExecutors,
  MAX_CODE,
  type ScriptRecord,
} from "@/lib/store";
import { getSupabaseConfigError } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { parsePlaceId, getPlaceName } from "@/lib/roblox";
import { enrichScriptViews } from "@/lib/thumbnails";

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
    const game = req.nextUrl.searchParams.get("game") || "";
    const tag = req.nextUrl.searchParams.get("tag") || "";
    const executor = req.nextUrl.searchParams.get("executor") || "";
    const verified = req.nextUrl.searchParams.get("verified") === "1";
    const scripts = await listScripts({ q, sort, game, tag, executor, verified });
    const views = await enrichScriptViews(scripts.map((s) => publicView(s)));
    return NextResponse.json(views);
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
    let gameLink = "";
    let tagsRaw: unknown = "";
    let executorsRaw: unknown = "";
    let code = "";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      title = (body.title || "").toString();
      description = (body.description || "").toString();
      gameLink = (body.gameLink || body.game_url || body.gamePlaceId || "").toString();
      tagsRaw = body.tags;
      executorsRaw = body.executors;
      code = (body.code || "").toString();
    } else {
      const form = await req.formData();
      title = (form.get("title") || "").toString();
      description = (form.get("description") || "").toString();
      gameLink = (form.get("gameLink") || form.get("game_url") || "").toString();
      tagsRaw = form.get("tags");
      executorsRaw = form.getAll("executors");
      code = (form.get("code") || "").toString();
      const file = form.get("file");
      if (file && typeof file !== "string") {
        code = Buffer.from(await file.arrayBuffer()).toString("utf8");
      }
    }

    title = title.trim();
    description = description.trim().slice(0, 2000);

    const gamePlaceId = parsePlaceId(gameLink);
    if (gameLink.trim() && !gamePlaceId) {
      return fail("Game link must be a Roblox games URL or place ID.", 400);
    }

    let game = "";
    if (gamePlaceId) {
      const fetched = await getPlaceName(gamePlaceId);
      if (fetched) game = fetched.slice(0, 80);
    }

    const tags = sanitizeTags(tagsRaw, game);
    const executors = sanitizeExecutors(executorsRaw);

    if (!title) return fail("A title is required.", 400);
    if (!code.trim()) return fail("Script code is required.", 400);
    if (code.length > MAX_CODE) return fail("Script is too large (max 500 KB).", 400);

    const record: ScriptRecord = {
      id: nanoid(10),
      title: title.slice(0, 120),
      description,
      author: author.slice(0, 60),
      game,
      gamePlaceId,
      tags,
      executors,
      code,
      views: 0,
      copies: 0,
      likes: 0,
      createdAt: new Date().toISOString(),
      userId: user.id,
    };

    const saved = await createScriptWithClient(supabase, record);
    return NextResponse.json(publicView(saved, true), { status: 201 });
  } catch (e) {
    return fail(e);
  }
}
