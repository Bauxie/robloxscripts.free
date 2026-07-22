import Link from "next/link";
import { listScripts, publicView } from "@/lib/store";
import { withThumbnails } from "@/lib/thumbnails";
import { getSupabaseConfigError } from "@/lib/supabase";
import BeachHero from "@/components/BeachHero";
import ScriptCard from "@/components/ScriptCard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function HomePage() {
  const configError = getSupabaseConfigError();
  let all: Awaited<ReturnType<typeof listScripts>> = [];
  let loadError = configError;

  if (!configError) {
    try {
      all = await listScripts();
    } catch (e) {
      loadError = e instanceof Error ? e.message : String(e);
      all = [];
    }
  }

  const scriptCount = all.length;
  const viewCount = all.reduce((a, s) => a + (s.views || 0), 0);

  const latest = await withThumbnails(
    [...all]
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 6)
      .map((s) => publicView(s))
  );

  const trending = await withThumbnails(
    [...all]
      .map((s) => ({ s, score: (s.views || 0) + (s.copies || 0) * 3 }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((x) => publicView(x.s))
  );

  const gameCounts = new Map<string, number>();
  for (const s of all) {
    const g = (s.game || "").trim();
    if (!g) continue;
    gameCounts.set(g, (gameCounts.get(g) || 0) + 1);
  }
  const topGames = [...gameCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }));

  return (
    <>
      <BeachHero scriptCount={scriptCount} viewCount={viewCount} topGames={topGames} />
      <div className="latest-band">
        <main className="app">
          {loadError ? (
            <div className="panel" style={{ marginTop: 24, marginBottom: 8 }}>
              <h3 style={{ marginBottom: 8 }}>Database connection issue</h3>
              <p className="muted" style={{ marginBottom: 10 }}>
                {loadError}
              </p>
              <p className="hint">
                Check <code>/api/health</code> on this site, confirm env vars on Vercel, then
                redeploy.
              </p>
            </div>
          ) : null}

          {trending.length > 0 ? (
            <>
              <div className="section-head">
                <div>
                  <span className="eyebrow">Popular right now</span>
                  <h2>🔥 Trending scripts</h2>
                  <p>Most viewed and copied by the community.</p>
                </div>
                <Link href="/scripts?sort=popular" className="btn btn-ghost btn-sm">
                  View trending →
                </Link>
              </div>
              <div className="grid">
                {trending.map((s) => (
                  <ScriptCard key={s.id} s={s} hot />
                ))}
              </div>
            </>
          ) : null}

          <div className="section-head">
            <div>
              <span className="eyebrow">Fresh uploads</span>
              <h2>🌊 Latest scripts</h2>
              <p>Just washed up on shore.</p>
            </div>
            <Link href="/scripts" className="btn btn-ghost btn-sm">
              View all →
            </Link>
          </div>

          {latest.length ? (
            <div className="grid">
              {latest.map((s) => (
                <ScriptCard key={s.id} s={s} />
              ))}
            </div>
          ) : (
            <div className="empty">
              <div className="big">🏝️</div>
              <h3>No scripts yet</h3>
              <p>Be the first to ride the wave.</p>
              <Link href="/upload" className="btn btn-primary" style={{ marginTop: 16 }}>
                ＋ Upload a script
              </Link>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
