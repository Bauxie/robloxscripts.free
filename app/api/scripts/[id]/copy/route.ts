import { NextRequest, NextResponse } from "next/server";
import { readScripts, writeScripts } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/scripts/:id/copy  -> increment copy counter
export function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const scripts = readScripts();
  const s = scripts.find((x) => x.id === params.id);
  if (!s) return NextResponse.json({ error: "Not found" }, { status: 404 });
  s.copies = (s.copies || 0) + 1;
  writeScripts(scripts);
  return NextResponse.json({ copies: s.copies });
}
