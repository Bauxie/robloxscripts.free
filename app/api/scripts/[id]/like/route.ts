import { NextRequest, NextResponse } from "next/server";
import { incrementLikes } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/scripts/:id/like  -> increment like counter
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const likes = await incrementLikes(params.id);
    if (likes === null) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ likes });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
