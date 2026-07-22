import { NextRequest, NextResponse } from "next/server";
import { incrementCopies } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/scripts/:id/copy  -> increment copy counter
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const copies = await incrementCopies(params.id);
    if (copies === null) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ copies });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
