import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { requireRoleManager } from "@/lib/auth";
import { normalizeRoles } from "@/lib/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : String(error);
  if (message === "UNAUTHORIZED") return NextResponse.json({ error: "Login required." }, { status: 401 });
  if (message === "FORBIDDEN") return NextResponse.json({ error: "Admins only." }, { status: 403 });
  return NextResponse.json({ error: message }, { status });
}

// GET /api/admin/users?q=
export async function GET(req: NextRequest) {
  try {
    await requireRoleManager();
    const q = (req.nextUrl.searchParams.get("q") || "").trim().toLowerCase();
    const admin = getAdminClient();

    let query = admin
      .from("profiles")
      .select("id, username, avatar_url, bio, roles, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (q) query = query.ilike("username", `%${q}%`);

    const { data, error } = await query;
    if (error) return fail(error.message);

    const users = data || [];
    const ids = users.map((u) => u.id as string);
    const scriptCounts = new Map<string, number>();

    if (ids.length) {
      const { data: scripts } = await admin.from("scripts").select("user_id").in("user_id", ids);
      for (const row of scripts || []) {
        const uid = row.user_id as string | null;
        if (!uid) continue;
        scriptCounts.set(uid, (scriptCounts.get(uid) || 0) + 1);
      }
    }

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        username: u.username,
        avatar_url: u.avatar_url,
        bio: u.bio || "",
        roles: normalizeRoles(u.roles),
        created_at: u.created_at,
        scriptCount: scriptCounts.get(u.id as string) || 0,
      })),
    });
  } catch (e) {
    return fail(e);
  }
}
