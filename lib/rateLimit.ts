import { getAdminClient } from "@/lib/supabase/admin";

type LimitOpts = {
  /** Unique bucket key, e.g. comment:userId */
  key: string;
  /** Max actions per window */
  limit: number;
  /** Window length in seconds */
  windowSeconds: number;
};

/**
 * DB-backed rate limit. Optional Upstash if UPSTASH_REDIS_REST_URL + TOKEN set
 * (install @upstash/ratelimit later — this fallback always works).
 */
export async function rateLimit(opts: LimitOpts): Promise<{ ok: boolean; remaining: number }> {
  const upstashUrl = (process.env.UPSTASH_REDIS_REST_URL || "").trim();
  const upstashToken = (process.env.UPSTASH_REDIS_REST_TOKEN || "").trim();

  if (upstashUrl && upstashToken) {
    try {
      const redisKey = `rl:${opts.key}`;
      const incr = await fetch(`${upstashUrl}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${upstashToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["INCR", redisKey],
          ["EXPIRE", redisKey, String(opts.windowSeconds)],
        ]),
      });
      if (incr.ok) {
        const data = (await incr.json()) as { result?: [number, unknown] };
        const count = Number(data?.result?.[0] || 0);
        return { ok: count <= opts.limit, remaining: Math.max(0, opts.limit - count) };
      }
    } catch {
      // fall through to DB
    }
  }

  const admin = getAdminClient();
  const bucket = opts.key.slice(0, 180);
  const now = Date.now();
  const { data } = await admin.from("rate_limits").select("*").eq("bucket", bucket).maybeSingle();

  if (!data) {
    await admin.from("rate_limits").upsert({
      bucket,
      count: 1,
      window_start: new Date(now).toISOString(),
    });
    return { ok: true, remaining: opts.limit - 1 };
  }

  const start = +new Date(data.window_start as string);
  if (now - start > opts.windowSeconds * 1000) {
    await admin
      .from("rate_limits")
      .update({ count: 1, window_start: new Date(now).toISOString() })
      .eq("bucket", bucket);
    return { ok: true, remaining: opts.limit - 1 };
  }

  const next = (data.count as number) + 1;
  await admin.from("rate_limits").update({ count: next }).eq("bucket", bucket);
  return { ok: next <= opts.limit, remaining: Math.max(0, opts.limit - next) };
}
