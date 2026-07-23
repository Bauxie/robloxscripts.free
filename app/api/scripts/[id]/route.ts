import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import {
  getScript,
  updateScriptWithClient,
  deleteScriptWithClient,
  deleteScriptAdmin,
  publicView,
  sanitizeTags,
  sanitizeExecutors,
  setScriptStaffFlags,
  MAX_CODE,
  incrementViews,
} from "@/lib/store";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { canModerate } from "@/lib/roles";
import { parsePlaceId, getPlaceName } from "@/lib/roblox";
import { createNotification } from "@/lib/notifications";
import { scanScriptCode } from "@/lib/scan";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : String(error);
  return NextResponse.json({ error: message }, { status });
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const s = await incrementViews(params.id);
    if (!s) return fail("Script not found", 404);
    return NextResponse.json(publicView(s, true));
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Login required.", 401);

    const existing = await getScript(params.id);
    if (!existing) return fail("Script not found", 404);

    const profile = await getCurrentProfile();
    const isOwner = existing.userId === user.id;
    const isStaff = profile ? canModerate(profile.roles) : false;

    const body = await req.json();

    // Staff-only flags
    if (isStaff && (body.featured != null || body.staffVerified != null)) {
      const saved = await setScriptStaffFlags(params.id, {
        featured: typeof body.featured === "boolean" ? body.featured : undefined,
        staffVerified:
          typeof body.staffVerified === "boolean" ? body.staffVerified : undefined,
      });
      if (!isOwner) return NextResponse.json(publicView(saved, true));
    }

    if (!isOwner) return fail("You can only edit your own scripts.", 403);

    const rl = await rateLimit({
      key: `script-edit:${user.id}`,
      limit: 30,
      windowSeconds: 3600,
    });
    if (!rl.ok) return fail("Too many edits — try later.", 429);

    let title = existing.title;
    let description = existing.description;
    let code = existing.code;
    let game = existing.game;
    let gamePlaceId = existing.gamePlaceId;
    let tags = existing.tags;
    let executors = existing.executors;
    let changelog = existing.changelog;
    let version = existing.version;
    const bumpVersion = Boolean(body.newVersion);

    if (typeof body.title === "string") title = body.title.trim().slice(0, 120);
    if (typeof body.description === "string") description = body.description.trim().slice(0, 2000);
    if (typeof body.code === "string") code = body.code;
    if (body.tags != null) tags = sanitizeTags(body.tags, game);
    if (body.executors != null) executors = sanitizeExecutors(body.executors);
    if (typeof body.changelog === "string") changelog = body.changelog.trim().slice(0, 2000);

    if (typeof body.gameLink === "string") {
      const link = body.gameLink.trim();
      if (link) {
        const parsed = parsePlaceId(link);
        if (!parsed) return fail("Invalid Roblox game link.", 400);
        gamePlaceId = parsed;
        const name = await getPlaceName(parsed);
        if (name) game = name.slice(0, 80);
      } else {
        gamePlaceId = null;
        game = "";
      }
    }

    if (!title) return fail("Title is required.", 400);
    if (!code.trim()) return fail("Code is required.", 400);
    if (code.length > MAX_CODE) return fail("Script is too large (max 500 KB).", 400);

    if (bumpVersion) {
      version = (existing.version || 1) + 1;
      if (!changelog) changelog = `Version ${version}`;
      await supabase.from("script_versions").insert({
        id: nanoid(12),
        script_id: params.id,
        version,
        changelog,
        user_id: user.id,
      });
    }

    const saved = await updateScriptWithClient(supabase, params.id, {
      title,
      description,
      code,
      game,
      gamePlaceId,
      tags,
      executors,
      changelog,
      version,
    });

    const warnings = scanScriptCode(code).map((h) => h.label);
    return NextResponse.json({ ...publicView(saved, true), warnings });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Login required.", 401);

    const existing = await getScript(params.id);
    if (!existing) return fail("Script not found", 404);

    const profile = await getCurrentProfile();
    const isOwner = existing.userId === user.id;
    const isStaff = profile ? canModerate(profile.roles) : false;

    if (!isOwner && !isStaff) return fail("Not allowed.", 403);

    if (isOwner && !isStaff) {
      await deleteScriptWithClient(supabase, params.id);
    } else {
      await deleteScriptAdmin(params.id);
      if (existing.userId && existing.userId !== user.id) {
        await createNotification({
          userId: existing.userId,
          kind: "moderation",
          title: "Script removed",
          body: `Your script “${existing.title}” was removed by staff.`,
          href: "/profile",
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
