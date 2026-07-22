import { NextResponse } from "next/server";
import { getSupabase, getSupabaseConfigError, isSupabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const configError = getSupabaseConfigError();
  if (configError) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        error: configError,
        hint: "Set env vars in Vercel, then Redeploy. Prefer SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 500 }
    );
  }

  try {
    const supabase = getSupabase();
    const { error, count } = await supabase
      .from("scripts")
      .select("*", { count: "exact", head: true });

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          configured: true,
          error: error.message,
          hint: "Did you run supabase/schema.sql in the Supabase SQL editor?",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      configured: isSupabaseConfigured(),
      scripts: count ?? 0,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, configured: true, error: (e as Error).message },
      { status: 500 }
    );
  }
}
