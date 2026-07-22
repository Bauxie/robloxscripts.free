import { NextRequest, NextResponse } from "next/server";
import { getScript, incrementLikes } from "@/lib/store";
import { createNotification } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/scripts/:id/like  -> increment like counter
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const script = await getScript(params.id);
    if (!script) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const likes = await incrementLikes(params.id);
    if (likes === null) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (script.userId) {
      await createNotification({
        userId: script.userId,
        kind: "like",
        title: "New like",
        body: `Someone liked “${script.title}”`,
        href: `/script/${script.id}`,
      }).catch(() => {});
    }

    return NextResponse.json({ likes });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
