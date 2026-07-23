import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listScripts, publicView, listGameSlugs } from "@/lib/store";
import { enrichScriptViews } from "@/lib/thumbnails";
import { gameMatchesSlug, slugifyGame } from "@/lib/games";
import ScriptCard from "@/components/ScriptCard";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PageProps = { params: { slug: string } };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const slug = decodeURIComponent(params.slug);
  const games = await listGameSlugs().catch(() => []);
  const match = games.find((g) => g.slug === slugifyGame(slug));
  const name = match?.name || slug.replace(/-/g, " ");
  const title = `${name} Roblox scripts`;
  const description = `Free ${name} scripts on ${SITE_NAME}. Browse, copy, and download community Lua scripts.`;
  return {
    title,
    description,
    keywords: [`${name} script`, `${name} roblox`, "roblox script", "free roblox script"],
    alternates: { canonical: `${SITE_URL}/game/${encodeURIComponent(slugifyGame(slug))}` },
    openGraph: { title, description, url: `${SITE_URL}/game/${slugifyGame(slug)}` },
  };
}

export default async function GamePage({ params }: PageProps) {
  const slug = slugifyGame(decodeURIComponent(params.slug));
  if (!slug) notFound();

  const scripts = await enrichScriptViews(
    (await listScripts({ gameSlug: slug, sort: "updated" })).map((s) => publicView(s))
  );

  if (!scripts.length) {
    // Still show page if no scripts — or 404? Show empty with name from slug
  }

  const displayName =
    scripts.find((s) => gameMatchesSlug(s.game, slug))?.game ||
    slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const views = scripts.reduce((a, s) => a + (s.views || 0), 0);

  return (
    <main className="app">
      <Link href="/scripts" className="back-link">
        ← All scripts
      </Link>

      <div className="panel" style={{ marginBottom: 24 }}>
        <div className="section-head" style={{ marginTop: 0 }}>
          <div>
            <span className="eyebrow">Game library</span>
            <h1>🎮 {displayName} scripts</h1>
            <p>
              {scripts.length} script{scripts.length === 1 ? "" : "s"} · {views} views · Free
              community uploads for {displayName}.
            </p>
          </div>
          <Link
            href={`/upload`}
            className="btn btn-primary btn-sm"
          >
            ＋ Upload for this game
          </Link>
        </div>
      </div>

      {scripts.length ? (
        <div className="grid">
          {scripts.map((s) => (
            <ScriptCard key={s.id} s={s} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <div className="big">🏝️</div>
          <h3>No scripts yet for {displayName}</h3>
          <p>Be the first to upload one.</p>
          <Link href="/upload" className="btn btn-primary" style={{ marginTop: 16 }}>
            ＋ Upload
          </Link>
        </div>
      )}
    </main>
  );
}
