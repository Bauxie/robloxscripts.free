import Link from "next/link";
import type { ScriptView } from "@/lib/store";
import { timeAgo } from "@/lib/format";

function displayTags(s: ScriptView): string[] {
  const game = (s.game || "").trim().toLowerCase();
  const gameCompact = game.replace(/[^a-z0-9]+/g, "");
  return (s.tags || [])
    .filter((t) => {
      const compact = t.replace(/[^a-z0-9]+/g, "");
      if (!gameCompact) return true;
      if (compact === gameCompact) return false;
      if (compact.startsWith(gameCompact) && compact.endsWith("script")) return false;
      return true;
    })
    .slice(0, 3);
}

export default function ScriptCard({
  s,
  hot = false,
}: {
  s: ScriptView;
  hot?: boolean;
}) {
  const tags = displayTags(s);

  return (
    <Link
      href={`/script/${s.id}`}
      className={`card${hot ? " card-hot" : ""}`}
      style={{ color: "inherit" }}
    >
      <h3>{s.title}</h3>
      {s.game ? (
        <div className="card-game" title={s.game}>
          <span>🎮</span>
          <span className="card-game-name">{s.game}</span>
        </div>
      ) : null}
      <p className="desc">{s.description || "No description provided."}</p>
      {tags.length ? (
        <div className="tags">
          {tags.map((t) => (
            <span className="tag" key={t} title={t}>
              #{t}
            </span>
          ))}
        </div>
      ) : null}
      <div className="meta">
        <span className="who">@{s.author}</span>
        <span className="meta-time">{timeAgo(s.createdAt)}</span>
      </div>
      <div className="card-stats" aria-label="Stats">
        <span title="Views">
          <span aria-hidden>👁</span>
          <b>{s.views}</b>
        </span>
        <span title="Likes">
          <span aria-hidden>❤️</span>
          <b>{s.likes || 0}</b>
        </span>
        <span title="Copies">
          <span aria-hidden>📋</span>
          <b>{s.copies || 0}</b>
        </span>
      </div>
    </Link>
  );
}
