import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/auth";
import { canModerate } from "@/lib/roles";
import { createNotification } from "@/lib/notifications";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : String(error);
  return NextResponse.json({ error: message }, { status });
}

export async function GET(req: NextRequest) {
  try {
    const profile = await getCurrentProfile();
    if (!profile || !canModerate(profile.roles)) return fail("Staff only.", 403);

    const status = req.nextUrl.searchParams.get("status") || "open";
    const admin = getAdminClient();
    const { data, error } = await admin
      .from("reports")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) return fail(error.message);

    const reports = data || [];
    const userIds = [
      ...new Set(
        reports
          .filter((r) => r.target_type === "user")
          .map((r) => r.target_id as string)
      ),
    ];
    const usernameById = new Map<string, string>();
    if (userIds.length) {
      const { data: profiles } = await admin
        .from("profiles")
        .select("id, username")
        .in("id", userIds);
      for (const p of profiles || []) {
        usernameById.set(p.id as string, p.username as string);
      }
    }

    return NextResponse.json({
      reports: reports.map((r) => ({
        ...r,
        target_label:
          r.target_type === "user"
            ? usernameById.get(r.target_id as string) || r.target_id
            : r.target_id,
        target_href:
          r.target_type === "script"
            ? `/script/${r.target_id}`
            : r.target_type === "user"
              ? `/u/${encodeURIComponent(
                  usernameById.get(r.target_id as string) || r.target_id
                )}`
              : null,
      })),
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

    const rl = await rateLimit({
      key: `report:${user.id}`,
      limit: 10,
      windowSeconds: 3600,
    });
    if (!rl.ok) return fail("Too many reports — try later.", 429);

    const body = await req.json();
    const targetType = String(body.targetType || "");
    const targetId = String(body.targetId || "").trim();
    const reason = String(body.reason || "").trim().slice(0, 80);
    const details = String(body.details || "").trim().slice(0, 1000);

    if (!["script", "user", "comment"].includes(targetType)) {
      return fail("Invalid report target.", 400);
    }
    if (!targetId || reason.length < 2) return fail("Reason is required.", 400);

    const { error } = await supabase.from("reports").insert({
      id: nanoid(12),
      reporter_id: user.id,
      target_type: targetType,
      target_id: targetId,
      reason,
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
    const status = body.status != null ? String(body.status) : null;
    const staffNotes =
      body.staffNotes != null ? String(body.staffNotes).trim().slice(0, 2000) : null;

    if (!id) return fail("Invalid update.", 400);
    if (status && !["resolved", "dismissed", "open"].includes(status)) {
      return fail("Invalid status.", 400);
    }

    const updates: Record<string, unknown> = {};
    if (status) {
      updates.status = status;
      updates.resolved_at = status === "open" ? null : new Date().toISOString();
      updates.resolved_by = status === "open" ? null : profile.id;
    }
    if (staffNotes != null) updates.staff_notes = staffNotes;

    const admin = getAdminClient();
    const { data, error } = await admin
      .from("reports")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();
    if (error) return fail(error.message);

    if (status && data?.reporter_id) {
      await createNotification({
        userId: data.reporter_id as string,
        kind: "report",
        title: "Report updated",
        body: `Your report was marked ${status}.`,
        href: "/notifications",
      });
    }

    return NextResponse.json({ report: data });
  } catch (e) {
    return fail(e);
  }
}
