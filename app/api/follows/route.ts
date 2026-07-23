import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { listScripts, publicView } from "@/lib/store";
import { enrichScriptViews } from "@/lib/thumbnails";
import { createNotification } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : String(error);
  return NextResponse.json({ error: message }, { status });
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Login required.", 401);

    const feed = req.nextUrl.searchParams.get("feed") === "1";
    const { data: follows, error } = await supabase
      .from("follows")
      .select("following_id, created_at")
      .eq("follower_id", user.id);
    if (error) return fail(error.message);

    const followingIds = (follows || []).map((f) => f.following_id as string);

    if (feed) {
      const scripts = await enrichScriptViews(
        (
          await listScripts({
            userIds: followingIds.length ? followingIds : ["__none__"],
            sort: "new",
          })
        )
          .slice(0, 40)
          .map((s) => publicView(s))
      );
      return NextResponse.json({ followingIds, scripts });
    }

    return NextResponse.json({ followingIds });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Login required.", 401);

    const body = await req.json();
    const followingId = String(body.userId || "").trim();
    if (!followingId) return fail("Missing userId.", 400);
    if (followingId === user.id) return fail("You can’t follow yourself.", 400);

    const { error } = await supabase.from("follows").upsert({
      follower_id: user.id,
      following_id: followingId,
    });
    if (error) return fail(error.message);

    const { data: me } = await getAdminClient()
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();

    await createNotification({
      userId: followingId,
      kind: "follow",
      title: "New follower",
      body: `@${me?.username || "someone"} followed you`,
      href: `/u/${encodeURIComponent(String(me?.username || ""))}`,
    }).catch(() => {});

    return NextResponse.json({ ok: true, following: true });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Login required.", 401);

    const followingId =
      req.nextUrl.searchParams.get("userId") ||
      String((await req.json().catch(() => ({}))).userId || "");
    if (!followingId) return fail("Missing userId.", 400);

    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", followingId);
    if (error) return fail(error.message);
    return NextResponse.json({ ok: true, following: false });
  } catch (e) {
    return fail(e);
  }
}
