import { NextRequest } from "next/server";
import { readScripts } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/scripts/:id/raw  -> plain-text download
export function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const scripts = readScripts();
  const s = scripts.find((x) => x.id === params.id);
  if (!s) return new Response("Not found", { status: 404 });
  const safeName = (s.title || "script").replace(/[^a-z0-9_\-]+/gi, "_").slice(0, 40);
  return new Response(s.code || "", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeName}.lua"`,
    },
  });
}
