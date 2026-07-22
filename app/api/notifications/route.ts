import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

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
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return fail(error.message);

    const unread = (data || []).filter((n) => !n.read_at).length;
    return NextResponse.json({ notifications: data || [], unread });
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Login required.", 401);

    const body = await req.json();
    const id = body.id ? String(body.id) : null;
    const markAll = Boolean(body.markAll);

    if (markAll) {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .is("read_at", null);
      if (error) return fail(error.message);
      return NextResponse.json({ ok: true });
    }

    if (!id) return fail("Missing notification id.", 400);
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return fail(error.message);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
