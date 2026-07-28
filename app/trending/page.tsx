import Link from "next/link";
import type { Metadata } from "next";
import { listScripts, publicView, type ScriptRecord } from "@/lib/store";
import { enrichScriptViews } from "@/lib/thumbnails";
import { getAdminClient } from "@/lib/supabase/admin";
import { normalizeRoles } from "@/lib/roles";
import { fmtCompact } from "@/lib/format";
import ScriptCard from "@/components/ScriptCard";
import RoleBadges from "@/components/RoleBadges";
import { profilePath } from "@/lib/profilePath";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Trending Roblox Scripts",
  description: `The hottest Roblox scripts right now and the top creators on ${SITE_NAME}.`,
  alternates: { canonical: `${SITE_URL}/trending` },
};

/** Reddit-style hot score: engagement over age decay. */
function hotScore(s: ScriptRecord): number {
  const ageHours = Math.max(0, (Date.now() - +new Date(s.createdAt)) / 3_600_000);
  const engagement = (s.likes || 0) * 6 + (s.copies || 0) * 3 + (s.views || 0);
  return engagement / Math.pow(ageHours + 2, 1.35);
}

type CreatorAgg = {
  userId: string;
  scripts: number;
  views: number;
  likes: number;
  copies: number;
};

export default async function TrendingPage() {
  const records = await listScripts({ sort: "new" }).catch(() => [] as ScriptRecord[]);

  // --- Trending scripts ---
  const hot = [...records].sort((a, b) => hotScore(b) - hotScore(a)).slice(0, 9);
  const hotViews = await enrichScriptViews(hot.map((s) => publicView(s)));

  // --- Top creators ---
  const byUser = new Map<string, CreatorAgg>();
  for (const s of records) {
    if (!s.userId) continue;
    const agg = byUser.get(s.userId) || {
      userId: s.userId,
      scripts: 0,
      views: 0,
      likes: 0,
      copies: 0,
    };
    agg.scripts += 1;
    agg.views += s.views || 0;
    agg.likes += s.likes || 0;
    agg.copies += s.copies || 0;
    byUser.set(s.userId, agg);
  }
  const top = [...byUser.values()]
    .sort(
      (a, b) =>
        b.views + b.likes * 10 + b.copies * 3 - (a.views + a.likes * 10 + a.copies * 3)
    )
    .slice(0, 10);

  const profileById = new Map<
    string,
    { username: string; avatar_url: string | null; roles: unknown }
  >();
  const followerCount = new Map<string, number>();

  if (top.length) {
    const ids = top.map((t) => t.userId);
    const admin = getAdminClient();
    const [{ data: profiles }, { data: follows }] = await Promise.all([
      admin.from("profiles").select("id, username, avatar_url, roles").in("id", ids),
      admin.from("follows").select("following_id").in("following_id", ids),
    ]);
    for (const p of profiles || []) {
      profileById.set(String(p.id), {
        username: String(p.username || "user"),
        avatar_url: (p.avatar_url as string | null) || null,
        roles: p.roles,
      });
    }
    for (const f of follows || []) {
      const id = String(f.following_id);
      followerCount.set(id, (followerCount.get(id) || 0) + 1);
    }
  }

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <main className="app">
      <Link href="/scripts" className="back-link">
        ← All scripts
      </Link>

      <div className="section-head">
        <div>
          <span className="eyebrow">Hot right now</span>
          <h1>🔥 Trending</h1>
          <p>Scripts blowing up right now — fresh uploads with the most action.</p>
        </div>
      </div>

      {hotViews.length ? (
        <div className="grid" style={{ marginBottom: 36 }}>
          {hotViews.map((s, i) => (
            <ScriptCard key={s.id} s={s} hot={i < 3} />
          ))}
        </div>
      ) : (
        <div className="empty" style={{ marginBottom: 36 }}>
          <div className="big">🏝️</div>
          <h3>Nothing trending yet</h3>
          <p>Upload a script to get things moving.</p>
        </div>
      )}

      <div className="section-head">
        <div>
          <span className="eyebrow">Leaderboard</span>
          <h2>🏆 Top creators</h2>
          <p>Ranked by total views, likes, and copies across all their scripts.</p>
        </div>
      </div>

      <div className="leaderboard panel">
        {top.map((t, i) => {
          const p = profileById.get(t.userId);
          if (!p) return null;
          return (
            <Link
              key={t.userId}
              href={profilePath(p.username)}
              className="leader-row"
            >
              <span className="leader-rank" aria-hidden>
                {medals[i] || `#${i + 1}`}
              </span>
              <span className="leader-avatar">
                {p.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.avatar_url} alt="" width={40} height={40} />
                ) : (
                  <span aria-hidden>{(p.username[0] || "?").toUpperCase()}</span>
                )}
              </span>
              <span className="leader-name">
                @{p.username}
                <RoleBadges roles={normalizeRoles(p.roles)} size="sm" />
              </span>
              <span className="leader-stats">
                <span title="Scripts">📜 {t.scripts}</span>
                <span title="Total views">👁 {fmtCompact(t.views)}</span>
                <span title="Total likes">❤️ {fmtCompact(t.likes)}</span>
                <span title="Followers">👥 {fmtCompact(followerCount.get(t.userId) || 0)}</span>
              </span>
            </Link>
          );
        })}
        {!top.length ? (
          <p className="muted" style={{ margin: 0 }}>
            No creators yet — the leaderboard fills in as scripts get uploaded.
          </p>
        ) : null}
      </div>
    </main>
  );
}
