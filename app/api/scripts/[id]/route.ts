import { NextRequest, NextResponse } from "next/server";
import { incrementViews, publicView } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/scripts/:id  (increments views)
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const s = await incrementViews(params.id);
    if (!s) return NextResponse.json({ error: "Script not found" }, { status: 404 });
    return NextResponse.json(publicView(s, true));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
