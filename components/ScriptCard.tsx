import Link from "next/link";
import type { ScriptView } from "@/lib/store";
import { timeAgo } from "@/lib/format";

export default function ScriptCard({
  s,
  hot = false,
}: {
  s: ScriptView;
  hot?: boolean;
}) {
  return (
    <Link
      href={`/script/${s.id}`}
      className={`card${hot ? " card-hot" : ""}`}
      style={{ color: "inherit" }}
    >
      {s.game ? <span className="badge-game">🎮 {s.game}</span> : null}
      <h3>{s.title}</h3>
      <p className="desc">{s.description || "No description provided."}</p>
      {s.tags?.length ? (
        <div className="tags">
          {s.tags.slice(0, 4).map((t) => (
            <span className="tag" key={t}>
              #{t}
            </span>
          ))}
        </div>
      ) : null}
      <div className="meta">
        <span className="who">@{s.author}</span>
        <span>· {timeAgo(s.createdAt)}</span>
      </div>
      <div className="card-stats">
        <span>
          👁 <b>{s.views}</b> views
        </span>
        <span>
          📋 <b>{s.copies || 0}</b> copies
        </span>
        <span>
          <b>{s.lines}</b> lines
        </span>
      </div>
    </Link>
  );
}
