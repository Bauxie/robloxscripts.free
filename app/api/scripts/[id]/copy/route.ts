import { NextRequest, NextResponse } from "next/server";
import { incrementCopies } from "@/lib/store";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/scripts/:id/copy  -> increment copy counter
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ip = (req.headers.get("x-forwarded-for") || "anon").split(",")[0].trim();
    const rl = await rateLimit({
      key: `copy:${ip}:${params.id}`.slice(0, 180),
      limit: 10,
      windowSeconds: 300,
    });
    if (!rl.ok) return NextResponse.json({ error: "Slow down." }, { status: 429 });

    const copies = await incrementCopies(params.id);
    if (copies === null) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ copies });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
