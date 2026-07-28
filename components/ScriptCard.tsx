"use client";

import Link from "next/link";
import type { ScriptView } from "@/lib/store";
import { timeAgo } from "@/lib/format";
import RoleBadges from "@/components/RoleBadges";
import { resolveExecutorLabel } from "@/lib/executors";
import ScriptManageButtons from "@/components/ScriptManageButtons";
import { gameHref } from "@/lib/games";
import { profilePath } from "@/lib/profilePath";

export default function ScriptCard({
  s,
  hot = false,
  showTags = false,
  manage = false,
}: {
  s: ScriptView;
  hot?: boolean;
  showTags?: boolean;
  manage?: boolean;
}) {
  const executors = (s.executors || [])
    .map((id) => resolveExecutorLabel(id))
    .filter((x) => x.id)
    .slice(0, 6);

  return (
    <article
      className={`card${hot ? " card-hot" : ""}${s.thumbnailUrl ? " card-has-media" : ""}${
        s.featured ? " card-featured" : ""
      }`}
    >
      <Link href={`/script/${s.id}`} className="card-media" style={{ color: "inherit" }}>
        {s.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.thumbnailUrl} alt="" width={512} height={512} />
        ) : (
          <div className="card-media-fallback" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="8 6 3 12 8 18" />
              <polyline points="16 6 21 12 16 18" />
              <line x1="13.5" y1="4.5" x2="10.5" y2="19.5" />
            </svg>
            <span className="card-media-fallback-label">{s.title}</span>
          </div>
        )}
        {s.keySystem ? <span className="badge-key-system card-media-key">🔑 Key System</span> : null}
        {s.game ? (
          <div className="card-media-game" title={s.game}>
            {s.game}
          </div>
        ) : (
          <div className="card-media-game card-media-game-none">Any game</div>
        )}
      </Link>

      <div className="card-body">
        <Link href={`/script/${s.id}`} style={{ color: "inherit", textDecoration: "none" }}>
          <h3>
            {s.title}{" "}
            {s.staffVerified ? (
              <span className="badge-verified-script" title="Staff verified">
                ✓
              </span>
            ) : null}
          </h3>
          <p className="desc">{s.description || "No description provided."}</p>
        </Link>
        {(s.featured || s.staffVerified) && (
          <div className="script-badges">
            {s.featured ? <span className="badge-featured">★ Featured</span> : null}
            {s.staffVerified ? (
              <span className="badge-verified-script">Staff verified</span>
            ) : null}
          </div>
        )}
        {s.game ? (
          <Link href={gameHref(s.game)} className="card-game-link">
            More {s.game} scripts →
          </Link>
        ) : null}
        {showTags && s.tags?.length ? (
          <div className="tags">
            {s.tags.slice(0, 3).map((t) => (
              <span className="tag" key={t} title={t}>
                #{t}
              </span>
            ))}
          </div>
        ) : null}
        {executors.length ? (
          <div className="tags executor-tags">
            {executors.map((ex) => (
              <span className="tag" key={ex.id}>
                {ex.name}
              </span>
            ))}
          </div>
        ) : null}
        <div className="meta">
          <Link href={profilePath(s.author)} className="who">
            <span className="author-avatar">
              {s.authorAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.authorAvatar} alt="" width={22} height={22} />
              ) : (
                <span aria-hidden>{(s.author[0] || "?").toUpperCase()}</span>
              )}
            </span>
            @{s.author}
            <RoleBadges roles={s.authorRoles} size="sm" />
          </Link>
          <span>· {timeAgo(s.updatedAt || s.createdAt)}</span>
        </div>
        <div className="card-stats">
          <span>
            👁 <b>{s.views}</b> views
          </span>
          <span>
            ❤️ <b>{s.likes || 0}</b> likes
          </span>
          <span>
            📋 <b>{s.copies || 0}</b> copies
          </span>
        </div>
        {manage ? <ScriptManageButtons scriptId={s.id} /> : null}
      </div>
    </article>
  );
}
