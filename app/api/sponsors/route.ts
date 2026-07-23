import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const placement = req.nextUrl.searchParams.get("placement") || "executors";
    const { data, error } = await getAdminClient()
      .from("sponsors")
      .select("*")
      .eq("active", true)
      .eq("placement", placement)
      .order("sort_order", { ascending: true });
    if (error) {
      // table may not exist yet
      return NextResponse.json({ sponsors: [] });
    }
    return NextResponse.json({ sponsors: data || [] });
  } catch {
    return NextResponse.json({ sponsors: [] });
  }
}
