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
import { getAdminClient, getSupabaseConfigError } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { parsePlaceId, getPlaceName } from "@/lib/roblox";
import { rateLimit } from "@/lib/rateLimit";
import { scanScriptCode } from "@/lib/scan";
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
    const keySystem = req.nextUrl.searchParams.get("keySystem") === "1";
    const verified = req.nextUrl.searchParams.get("verified") === "1";
    const staffVerified = req.nextUrl.searchParams.get("staffVerified") === "1";
    const featured = req.nextUrl.searchParams.get("featured") === "1";
    const scripts = await listScripts({
      q,
      sort,
      game,
      tag,
      executor,
      keySystem: keySystem || undefined,
      verified,
      staffVerified,
      featured,
    });
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

    const rl = await rateLimit({
      key: `upload:${user.id}`,
      limit: 8,
      windowSeconds: 3600,
    });
    if (!rl.ok) return fail("Upload rate limit — try again later.", 429);

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
    let keySystem = false;

    if (contentType.includes("application/json")) {
      const body = await req.json();
      title = (body.title || "").toString();
      description = (body.description || "").toString();
      gameLink = (body.gameLink || body.game_url || body.gamePlaceId || "").toString();
      tagsRaw = body.tags;
      executorsRaw = body.executors;
      code = (body.code || "").toString();
      keySystem = Boolean(body.keySystem);
    } else {
      const form = await req.formData();
      title = (form.get("title") || "").toString();
      description = (form.get("description") || "").toString();
      gameLink = (form.get("gameLink") || form.get("game_url") || "").toString();
      tagsRaw = form.get("tags");
      executorsRaw = form.getAll("executors");
      code = (form.get("code") || "").toString();
      keySystem =
        form.get("keySystem") === "1" ||
        form.get("keySystem") === "on" ||
        form.get("keySystem") === "true";
      const file = form.get("file");
      if (file && typeof file !== "string") {
        const size = typeof file.size === "number" ? file.size : 0;
        if (size > MAX_CODE) {
          return fail("Script is too large (max 500 KB).", 400);
        }
        code = Buffer.from(await file.arrayBuffer()).toString("utf8");
      }
    }

    title = title.trim();
    description = description.trim().slice(0, 2000);

    const { validateUploadFields, firstUploadError } = await import("@/lib/uploadValidation");

    const fieldErrors = validateUploadFields({
      title,
      description,
      gameLink,
      code,
      executors: sanitizeExecutors(executorsRaw),
    });
    const first = firstUploadError(fieldErrors);
    if (first) return fail(first, 400);

    const gamePlaceId = parsePlaceId(gameLink);
    let game = "";
    if (gamePlaceId) {
      const fetched = await getPlaceName(gamePlaceId);
      if (fetched) game = fetched.slice(0, 80);
    }

    const tags = sanitizeTags(tagsRaw, game);
    const executors = sanitizeExecutors(executorsRaw);

    // Anti-spam: block re-uploading the same title or identical code within 24h
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentUploads } = await getAdminClient()
      .from("scripts")
      .select("title, code")
      .eq("user_id", user.id)
      .gte("created_at", since)
      .limit(10);
    const titleNorm = title.toLowerCase();
    const codeNorm = code.trim();
    for (const r of recentUploads || []) {
      if (String(r.title || "").toLowerCase() === titleNorm) {
        return fail("You already uploaded a script with this title today.", 409);
      }
      if (String(r.code || "").trim() === codeNorm) {
        return fail("You already uploaded this exact script today.", 409);
      }
    }

    const scanHits = scanScriptCode(code);
    const now = new Date().toISOString();
    const id = nanoid(10);
    const record: ScriptRecord = {
      id,
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
      createdAt: now,
      updatedAt: now,
      changelog: "Initial release",
      version: 1,
      versionGroup: id,
      featured: false,
      staffVerified: false,
      worksCount: 0,
      brokenCount: 0,
      keySystem,
      userId: user.id,
    };

    const saved = await createScriptWithClient(supabase, record);
    return NextResponse.json(
      { ...publicView(saved, true), warnings: scanHits.map((h) => h.label) },
      { status: 201 }
    );
  } catch (e) {
    return fail(e);
  }
}
