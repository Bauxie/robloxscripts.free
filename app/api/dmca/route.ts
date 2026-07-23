import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/auth";
import { canModerate } from "@/lib/roles";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : String(error);
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    const profile = await getCurrentProfile();
    if (!profile || !canModerate(profile.roles)) return fail("Staff only.", 403);
    const { data, error } = await getAdminClient()
      .from("dmca_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) return fail(error.message);
    return NextResponse.json({ requests: data || [] });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const rlKey =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "anon";
    const rl = await rateLimit({
      key: `dmca:${rlKey}`,
      limit: 5,
      windowSeconds: 86400,
    });
    if (!rl.ok) return fail("Too many requests today.", 429);

    const body = await req.json();
    const name = String(body.name || "").trim().slice(0, 120);
    const email = String(body.email || "").trim().slice(0, 200);
    const urls = String(body.urls || "").trim().slice(0, 4000);
    const details = String(body.details || "").trim().slice(0, 4000);

    if (name.length < 2) return fail("Name is required.", 400);
    if (!email.includes("@")) return fail("Valid email required.", 400);
    if (urls.length < 5) return fail("List the URLs of the content.", 400);

    const supabase = createServerSupabase();
    const { error } = await supabase.from("dmca_requests").insert({
      id: nanoid(12),
      name,
      email,
      urls,
      details,
      status: "open",
    });
    if (error) return fail(error.message);

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const profile = await getCurrentProfile();
    if (!profile || !canModerate(profile.roles)) return fail("Staff only.", 403);
    const body = await req.json();
    const id = String(body.id || "");
    const status = String(body.status || "");
    if (!id || !["open", "resolved", "dismissed"].includes(status)) {
      return fail("Invalid update.", 400);
    }
    const { data, error } = await getAdminClient()
      .from("dmca_requests")
      .update({ status })
      .eq("id", id)
      .select("*")
      .single();
    if (error) return fail(error.message);
    return NextResponse.json({ request: data });
  } catch (e) {
    return fail(e);
  }
}
