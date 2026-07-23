import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getScript } from "@/lib/store";
import { EXECUTORS } from "@/lib/executors";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXECUTOR_IDS = new Set(EXECUTORS.map((e) => e.id));

function fail(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : String(error);
  return NextResponse.json({ error: message }, { status });
}

async function recount(scriptId: string) {
  const admin = getAdminClient();
  const { data } = await admin.from("script_votes").select("vote").eq("script_id", scriptId);
  const works = (data || []).filter((v) => v.vote === "works").length;
  const broken = (data || []).filter((v) => v.vote === "broken").length;
  await admin
    .from("scripts")
    .update({ works_count: works, broken_count: broken })
    .eq("id", scriptId);
  return { works, broken };
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = getAdminClient();
    const { data, error } = await admin
      .from("script_votes")
      .select("executor_id, vote, user_id")
      .eq("script_id", params.id);
    if (error) return fail(error.message);

    const byExecutor: Record<string, { works: number; broken: number }> = {};
    for (const row of data || []) {
      const ex = row.executor_id as string;
      if (!byExecutor[ex]) byExecutor[ex] = { works: 0, broken: 0 };
      if (row.vote === "works") byExecutor[ex].works += 1;
      else byExecutor[ex].broken += 1;
    }

    return NextResponse.json({ votes: data || [], byExecutor });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Login required.", 401);

    const script = await getScript(params.id);
    if (!script) return fail("Script not found", 404);

    const rl = await rateLimit({
      key: `vote:${user.id}`,
      limit: 40,
      windowSeconds: 3600,
    });
    if (!rl.ok) return fail("Too many votes — slow down.", 429);

    const body = await req.json();
    const executorId = String(body.executorId || "").trim().toLowerCase();
    const vote = String(body.vote || "").trim().toLowerCase();
    if (!EXECUTOR_IDS.has(executorId)) return fail("Invalid executor.", 400);
    if (vote !== "works" && vote !== "broken") return fail("Vote must be works or broken.", 400);

    const { error } = await supabase.from("script_votes").upsert({
      script_id: params.id,
      user_id: user.id,
      executor_id: executorId,
      vote,
    });
    if (error) return fail(error.message);

    const counts = await recount(params.id);
    return NextResponse.json({ ok: true, ...counts });
  } catch (e) {
    return fail(e);
  }
}
