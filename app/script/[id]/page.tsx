import Link from "next/link";
import type { Metadata } from "next";
import { getScript, incrementViews, publicView } from "@/lib/store";
import { resolveRobloxGame } from "@/lib/roblox";
import { withAuthorAvatars } from "@/lib/thumbnails";
import { buildScriptMetadata, scriptJsonLd } from "@/lib/seo";
import ScriptView from "@/components/ScriptView";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PageProps = { params: { id: string } };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const script = await getScript(params.id);
    if (!script) {
      return {
        title: "Script not found",
        robots: { index: false, follow: false },
      };
    }
    return buildScriptMetadata(script);
  } catch {
    return { title: "Script" };
  }
}

export default async function ScriptPage({ params }: PageProps) {
  let record = null;
  try {
    record = await incrementViews(params.id);
  } catch {
    record = null;
  }

  if (!record) {
    return (
      <main className="app">
        <div className="empty">
          <div className="big">🌊</div>
          <h3>Script not found</h3>
          <p>It may have drifted away.</p>
          <Link href="/scripts" className="btn btn-primary" style={{ marginTop: 16 }}>
            Browse scripts
          </Link>
        </div>
      </main>
    );
  }

  let game = null;
  if (record.gamePlaceId) {
    try {
      game = await resolveRobloxGame(record.gamePlaceId, {
        fetchName: !record.game,
      });
    } catch {
      game = {
        placeId: record.gamePlaceId,
        name: record.game || null,
        thumbnailUrl: null,
        playUrl: `https://www.roblox.com/games/${record.gamePlaceId}`,
      };
    }
  }

  const jsonLd = scriptJsonLd(record, {
    thumbnailUrl: game?.thumbnailUrl,
    playUrl: game?.playUrl,
  });

  const [view] = await withAuthorAvatars([publicView(record, true)]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ScriptView s={view} game={game} />
    </>
  );
}
