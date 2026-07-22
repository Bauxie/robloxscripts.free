import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getScript, incrementLikes } from "@/lib/store";
import { createNotification } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/scripts/:id/like — one like per signed-in user
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Login required to like." }, { status: 401 });
    }

    const script = await getScript(params.id);
    if (!script) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { error: likeError } = await supabase.from("script_likes").insert({
      script_id: params.id,
      user_id: user.id,
    });

    if (likeError) {
      // Unique violation = already liked
      if (likeError.code === "23505" || /duplicate|unique/i.test(likeError.message)) {
        return NextResponse.json({ likes: script.likes || 0, alreadyLiked: true });
      }
      // Table missing until security.sql is applied — fail closed on forge, soft fail message
      if (/script_likes|does not exist|schema cache/i.test(likeError.message)) {
        return NextResponse.json(
          { error: "Likes are temporarily unavailable. Run supabase/security.sql." },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: likeError.message }, { status: 500 });
    }

    const likes = await incrementLikes(params.id);
    if (likes === null) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (script.userId && script.userId !== user.id) {
      const { data: profile } = await getAdminClient()
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .maybeSingle();
      await createNotification({
        userId: script.userId,
        kind: "like",
        title: "New like",
        body: `@${profile?.username || "someone"} liked “${script.title}”`,
        href: `/script/${script.id}`,
      }).catch(() => {});
    }

    return NextResponse.json({ likes, alreadyLiked: false });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
