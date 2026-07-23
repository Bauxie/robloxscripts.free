import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { listScripts, publicView } from "@/lib/store";
import { enrichScriptViews } from "@/lib/thumbnails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : String(error);
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    const supabase = createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Login required.", 401);

    const { data, error } = await supabase
      .from("favorites")
      .select("script_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) return fail(error.message);

    const ids = (data || []).map((r) => r.script_id as string);
    const scripts = await enrichScriptViews(
      (await listScripts({ ids, sort: "new" })).map((s) => publicView(s))
    );
    // preserve favorite order
    const byId = new Map(scripts.map((s) => [s.id, s]));
    return NextResponse.json({
      favorites: ids.map((id) => byId.get(id)).filter(Boolean),
    });
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
    const scriptId = String(body.scriptId || "").trim();
    if (!scriptId) return fail("Missing scriptId.", 400);

    const { error } = await supabase.from("favorites").upsert({
      user_id: user.id,
      script_id: scriptId,
    });
    if (error) return fail(error.message);
    return NextResponse.json({ ok: true, favorited: true });
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

    const scriptId =
      req.nextUrl.searchParams.get("scriptId") ||
      String((await req.json().catch(() => ({}))).scriptId || "");
    if (!scriptId) return fail("Missing scriptId.", 400);

    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("script_id", scriptId);
    if (error) return fail(error.message);
    return NextResponse.json({ ok: true, favorited: false });
  } catch (e) {
    return fail(e);
  }
}

/** Check if current user favorited a script */
export async function HEAD(req: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse(null, { status: 401 });
  const scriptId = req.nextUrl.searchParams.get("scriptId");
  if (!scriptId) return new NextResponse(null, { status: 400 });
  const { data } = await getAdminClient()
    .from("favorites")
    .select("script_id")
    .eq("user_id", user.id)
    .eq("script_id", scriptId)
    .maybeSingle();
  return new NextResponse(null, { status: data ? 200 : 404 });
}
