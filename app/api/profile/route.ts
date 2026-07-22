import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  formatCooldown,
  getCurrentProfile,
  normalizeUsername,
  usernameCooldownRemaining,
  validateUsername,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : String(error);
  return NextResponse.json({ error: message }, { status });
}

// PATCH /api/profile — update username and/or bio
export async function PATCH(req: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("You must be logged in.", 401);

    const profile = await getCurrentProfile();
    if (!profile) return fail("Profile not found.", 404);

    const body = await req.json();
    const updates: Record<string, unknown> = {};
    let usernameChanged = false;

    if (typeof body.bio === "string") {
      updates.bio = body.bio.trim().slice(0, 160);
    }

    if (typeof body.username === "string") {
      const next = normalizeUsername(body.username);
      const invalid = validateUsername(next);
      if (invalid) return fail(invalid, 400);

      if (next !== profile.username) {
        const remaining = usernameCooldownRemaining(profile);
        if (remaining > 0) {
          return fail(
            `You can change your username again in ${formatCooldown(remaining)}.`,
            429
          );
        }

        const admin = getAdminClient();
        const { data: taken } = await admin
          .from("profiles")
          .select("id")
          .ilike("username", next)
          .neq("id", profile.id)
          .maybeSingle();
        if (taken) return fail("That username is already taken.", 409);

        updates.username = next;
        updates.username_changed_at = new Date().toISOString();
        usernameChanged = true;
      }
    }

    if (!Object.keys(updates).length) {
      return NextResponse.json({ profile });
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", profile.id)
      .select("id, username, avatar_url, bio, created_at, username_changed_at")
      .single();

    if (error) {
      if (error.code === "23505") return fail("That username is already taken.", 409);
      return fail(error.message, 400);
    }

    // Keep denormalized author labels in sync
    if (usernameChanged && typeof updates.username === "string") {
      const admin = getAdminClient();
      await admin
        .from("scripts")
        .update({ author: updates.username })
        .eq("user_id", profile.id);
    }

    return NextResponse.json({
      profile: {
        ...data,
        bio: data.bio || "",
        username_changed_at: data.username_changed_at || null,
      },
    });
  } catch (e) {
    return fail(e);
  }
}
