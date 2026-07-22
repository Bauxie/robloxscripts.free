import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { requireRoleManager } from "@/lib/auth";
import {
  canAssignRole,
  isRoleId,
  normalizeRoles,
  type RoleId,
  withBootstrapOwner,
} from "@/lib/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : String(error);
  if (message === "UNAUTHORIZED") return NextResponse.json({ error: "Login required." }, { status: 401 });
  if (message === "FORBIDDEN") return NextResponse.json({ error: "Admins only." }, { status: 403 });
  return NextResponse.json({ error: message }, { status });
}

// PATCH /api/admin/users/:id/roles
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const actor = await requireRoleManager();
    const body = await req.json();
    const requested = normalizeRoles(body.roles);

    const admin = getAdminClient();
    const { data: target, error: targetError } = await admin
      .from("profiles")
      .select("id, username, roles")
      .eq("id", params.id)
      .maybeSingle();

    if (targetError) return fail(targetError.message);
    if (!target) return fail("User not found.", 404);

    const current = normalizeRoles(target.roles);
    const actorRoles = withBootstrapOwner(actor, actor.roles);

    // Permission checks for each change
    const added = requested.filter((r) => !current.includes(r));
    const removed = current.filter((r) => !requested.includes(r));

    for (const role of [...added, ...removed]) {
      if (!canAssignRole(actorRoles, role)) {
        return fail("You can’t change the Owner role.", 403);
      }
    }

    if (added.includes("verified") || (!current.includes("verified") && requested.includes("verified"))) {
      // Verified only if they uploaded at least one script
      if (requested.includes("verified")) {
        const { count, error: countError } = await admin
          .from("scripts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", params.id);
        if (countError) return fail(countError.message);
        if (!count) {
          return fail("Verified can only be given to users who uploaded a script.", 400);
        }
      }
    }

    // Don't leave the site with zero owners if targeting a bootstrap/owner
    if (removed.includes("owner")) {
      const { data: owners } = await admin
        .from("profiles")
        .select("id")
        .contains("roles", ["owner"]);
      const otherOwners = (owners || []).filter((o) => o.id !== params.id);
      if (!otherOwners.length && !actorRoles.includes("owner")) {
        return fail("Cannot remove the last Owner.", 400);
      }
    }

    const nextRoles = requested.filter((r): r is RoleId => isRoleId(r));

    const { data, error } = await admin
      .from("profiles")
      .update({ roles: nextRoles })
      .eq("id", params.id)
      .select("id, username, avatar_url, roles")
      .single();

    if (error) return fail(error.message);

    return NextResponse.json({
      user: {
        id: data.id,
        username: data.username,
        avatar_url: data.avatar_url,
        roles: normalizeRoles(data.roles),
      },
    });
  } catch (e) {
    return fail(e);
  }
}
