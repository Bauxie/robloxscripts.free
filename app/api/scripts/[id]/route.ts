import { NextRequest, NextResponse } from "next/server";
import { readScripts, writeScripts, publicView } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/scripts/:id  (increments views)
export function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const scripts = readScripts();
  const s = scripts.find((x) => x.id === params.id);
  if (!s) return NextResponse.json({ error: "Script not found" }, { status: 404 });
  s.views = (s.views || 0) + 1;
  writeScripts(scripts);
  return NextResponse.json(publicView(s, true));
}
