import { NextRequest } from "next/server";
import { getScript } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/scripts/:id/raw  -> plain-text download
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const s = await getScript(params.id);
    if (!s) return new Response("Not found", { status: 404 });
    const safeName = (s.title || "script").replace(/[^a-z0-9_\-]+/gi, "_").slice(0, 40);
    return new Response(s.code || "", {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${safeName}.lua"`,
      },
    });
  } catch (e) {
    return new Response((e as Error).message, { status: 500 });
  }
}
