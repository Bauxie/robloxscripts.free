import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getAdminClient } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { getScript } from "@/lib/store";
import { createNotification } from "@/lib/notifications";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : String(error);
  return NextResponse.json({ error: message }, { status });
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = getAdminClient();
    const { data, error } = await admin
      .from("comments")
      .select("id, script_id, user_id, body, created_at")
      .eq("script_id", params.id)
      .order("created_at", { ascending: true });
    if (error) return fail(error.message);

    const userIds = [...new Set((data || []).map((c) => c.user_id as string))];
    const profiles = new Map<string, { username: string; avatar_url: string | null }>();
    if (userIds.length) {
      const { data: rows } = await admin
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);
      for (const row of rows || []) {
        profiles.set(row.id as string, {
          username: row.username as string,
          avatar_url: (row.avatar_url as string | null) || null,
        });
      }
    }

    return NextResponse.json({
      comments: (data || []).map((c) => ({
        id: c.id,
        scriptId: c.script_id,
        userId: c.user_id,
        body: c.body,
        createdAt: c.created_at,
        author: profiles.get(c.user_id as string)?.username || "user",
        avatarUrl: profiles.get(c.user_id as string)?.avatar_url || null,
      })),
    });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Login required.", 401);

    const rl = await rateLimit({
      key: `comment:${user.id}`,
      limit: 20,
      windowSeconds: 3600,
    });
    if (!rl.ok) return fail("Comment rate limit — try later.", 429);

    const script = await getScript(params.id);
    if (!script) return fail("Script not found", 404);

    const body = await req.json();
    const text = String(body.body || "").trim();
    if (text.length < 1 || text.length > 1000) {
      return fail("Comment must be 1–1000 characters.", 400);
    }

    const id = nanoid(12);
    const { data, error } = await supabase
      .from("comments")
      .insert({
        id,
        script_id: params.id,
        user_id: user.id,
        body: text,
      })
      .select("id, script_id, user_id, body, created_at")
      .single();
    if (error) return fail(error.message);

    if (script.userId && script.userId !== user.id) {
      const { data: profile } = await getAdminClient()
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .maybeSingle();
      await createNotification({
        userId: script.userId,
        kind: "comment",
        title: "New comment",
        body: `@${profile?.username || "someone"} commented on “${script.title}”`,
        href: `/script/${script.id}`,
      });
    }

    return NextResponse.json({ comment: data }, { status: 201 });
  } catch (e) {
    return fail(e);
  }
}
