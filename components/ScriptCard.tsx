import Link from "next/link";
import type { ScriptView } from "@/lib/store";
import { timeAgo } from "@/lib/format";
import RoleBadges from "@/components/RoleBadges";

export default function ScriptCard({
  s,
  hot = false,
  showTags = false,
}: {
  s: ScriptView;
  hot?: boolean;
  showTags?: boolean;
}) {
  return (
    <Link
      href={`/script/${s.id}`}
      className={`card${hot ? " card-hot" : ""}${s.thumbnailUrl ? " card-has-media" : ""}`}
      style={{ color: "inherit" }}
    >
      <div className="card-media">
        {s.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.thumbnailUrl} alt="" width={512} height={512} />
        ) : (
          <div className="card-media-fallback" aria-hidden>
            🎮
          </div>
        )}
        {s.game ? (
          <div className="card-media-game" title={s.game}>
            🎮 {s.game}
          </div>
        ) : null}
      </div>

      <div className="card-body">
        <h3>{s.title}</h3>
        <p className="desc">{s.description || "No description provided."}</p>
        {showTags && s.tags?.length ? (
          <div className="tags">
            {s.tags.slice(0, 3).map((t) => (
              <span className="tag" key={t} title={t}>
                #{t}
              </span>
            ))}
          </div>
        ) : null}
        <div className="meta">
          <span className="who">
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
          </span>
          <span>· {timeAgo(s.createdAt)}</span>
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
      </div>
    </Link>
  );
}
