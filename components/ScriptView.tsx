"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ScriptView as ScriptViewType } from "@/lib/store";
import { timeAgo, fmtBytes, highlightLua } from "@/lib/format";
import { useToast } from "@/components/ToastProvider";
import RoleBadges from "@/components/RoleBadges";
import CommentsSection from "@/components/CommentsSection";
import ReportButton from "@/components/ReportButton";
import AdUnit from "@/components/AdUnit";
import FavoriteButton from "@/components/FavoriteButton";
import ShareButtons from "@/components/ShareButtons";
import CompatVotes from "@/components/CompatVotes";
import RecentlyViewed, { pushRecentScript } from "@/components/RecentlyViewed";
import { EXECUTORS } from "@/lib/executors";
import { gameHref } from "@/lib/games";

type GamePreview = {
  placeId: string;
  name: string | null;
  thumbnailUrl: string | null;
  playUrl: string;
};

function likeKey(id: string) {
  return `liked:${id}`;
}

export default function ScriptView({
  s,
  game,
  canEdit = false,
  canComment = false,
  canReport = false,
  canFavorite = false,
  canVote = false,
  canModerateScript = false,
}: {
  s: ScriptViewType;
  game?: GamePreview | null;
  canEdit?: boolean;
  canComment?: boolean;
  canReport?: boolean;
  canFavorite?: boolean;
  canVote?: boolean;
  canModerateScript?: boolean;
}) {
  const toast = useToast();
  const html = useMemo(() => highlightLua(s.code || ""), [s.code]);
  const [likes, setLikes] = useState(s.likes || 0);
  const [liked, setLiked] = useState(false);
  const [featured, setFeatured] = useState(s.featured);
  const [staffVerified, setStaffVerified] = useState(s.staffVerified);

  useEffect(() => {
    try {
      setLiked(localStorage.getItem(likeKey(s.id)) === "1");
    } catch {
      setLiked(false);
    }
    pushRecentScript({ id: s.id, title: s.title });
  }, [s.id, s.title]);

  async function toggleStaff(flag: "featured" | "staffVerified", value: boolean) {
    try {
      const res = await fetch(`/api/scripts/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [flag]: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      if (flag === "featured") setFeatured(value);
      else setStaffVerified(value);
      toast("Updated");
    } catch (e) {
      toast((e as Error).message, true);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(s.code || "");
      toast("Copied to clipboard! 📋");
      fetch(`/api/scripts/${s.id}/copy`, { method: "POST" }).catch(() => {});
    } catch {
      toast("Copy failed — select manually", true);
    }
  }

  async function like() {
    if (liked) {
      toast("You already liked this");
      return;
    }
    setLiked(true);
    setLikes((n) => n + 1);
    try {
      localStorage.setItem(likeKey(s.id), "1");
    } catch {
      // ignore
    }
    try {
      const res = await fetch(`/api/scripts/${s.id}/like`, { method: "POST" });
      const data = await res.json();
      if (res.status === 401) {
        setLiked(false);
        setLikes((n) => Math.max(0, n - 1));
        try {
          localStorage.removeItem(likeKey(s.id));
        } catch {
          // ignore
        }
        toast("Log in to like scripts", true);
        return;
      }
      if (!res.ok) throw new Error(data.error || "Like failed");
      if (typeof data.likes === "number") setLikes(data.likes);
      if (data.alreadyLiked) toast("You already liked this");
      else toast("Liked! ❤️");
    } catch {
      setLiked(false);
      setLikes((n) => Math.max(0, n - 1));
      try {
        localStorage.removeItem(likeKey(s.id));
      } catch {
        // ignore
      }
      toast("Couldn’t like right now", true);
    }
  }

  async function remove() {
    if (!confirm("Delete this script?")) return;
    try {
      const res = await fetch(`/api/scripts/${s.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      toast("Script deleted");
      window.location.href = "/profile";
    } catch (e) {
      toast((e as Error).message, true);
    }
  }

  const gameLabel = game?.name || s.game || "Roblox game";
  const executorLabels = (s.executors || [])
    .map((id) => EXECUTORS.find((e) => e.id === id))
    .filter(Boolean);

  return (
    <main className="app">
      <Link href="/scripts" className="back-link">
        ← All scripts
      </Link>
      <div className="panel">
        <div className="detail-head">
          <div>
            <h1>
              {s.title}{" "}
              <span className="version-pill">v{s.version || 1}</span>
            </h1>
            <div className="script-badges">
              {staffVerified ? (
                <span className="badge-verified-script" title="Staff reviewed">
                  ✓ Staff verified
                </span>
              ) : null}
              {featured ? <span className="badge-featured">★ Featured</span> : null}
            </div>
            <div className="detail-sub detail-author">
              <span className="author-avatar author-avatar-md">
                {s.authorAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.authorAvatar} alt="" width={28} height={28} />
                ) : (
                  <span aria-hidden>{(s.author[0] || "?").toUpperCase()}</span>
                )}
              </span>
              by{" "}
              <Link href={`/u/${encodeURIComponent(s.author)}`}>
                <b>@{s.author}</b>
              </Link>
              <RoleBadges roles={s.authorRoles} size="sm" />
              <span>· {timeAgo(s.createdAt)}</span>
              {s.updatedAt && s.updatedAt !== s.createdAt ? (
                <span>· updated {timeAgo(s.updatedAt)}</span>
              ) : null}
              {s.game ? (
                <>
                  {" · "}
                  <Link href={gameHref(s.game)}>🎮 {s.game}</Link>
                </>
              ) : null}
            </div>
            {s.changelog ? (
              <p className="changelog-line">
                <b>Changelog:</b> {s.changelog}
              </p>
            ) : null}
            {s.tags?.length ? (
              <div className="tags">
                {s.tags.map((t) => (
                  <Link key={t} href={`/scripts?tag=${encodeURIComponent(t)}`} className="tag tag-link">
                    #{t}
                  </Link>
                ))}
              </div>
            ) : null}
            {executorLabels.length ? (
              <div className="tags" style={{ marginTop: 8 }}>
                {executorLabels.map((ex) => (
                  <Link
                    key={ex!.id}
                    href={`/scripts?executor=${encodeURIComponent(ex!.id)}`}
                    className="tag tag-link"
                  >
                    {ex!.emoji} {ex!.name}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
          <div className="detail-cta">
            <button type="button" className="btn btn-primary" onClick={copy}>
              📋 Copy script
            </button>
            <button
              type="button"
              className={`btn btn-ghost${liked ? " is-liked" : ""}`}
              onClick={like}
              disabled={liked}
            >
              {liked ? "❤️ Liked" : "🤍 Like"}
            </button>
            <a className="btn btn-ghost" href={`/api/scripts/${s.id}/raw`}>
              ⬇ Download .lua
            </a>
            <FavoriteButton scriptId={s.id} canFavorite={canFavorite} />
            {canEdit ? (
              <>
                <Link href={`/script/${s.id}/edit`} className="btn btn-ghost">
                  Edit
                </Link>
                <button type="button" className="btn btn-ghost" onClick={remove}>
                  Delete
                </button>
              </>
            ) : null}
            {canReport ? (
              <>
                <ReportButton targetType="script" targetId={s.id} label="Report" />
                <ReportButton
                  targetType="script"
                  targetId={s.id}
                  label="Report broken"
                  defaultReason="broken"
                />
              </>
            ) : null}
            {canModerateScript ? (
              <>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => toggleStaff("featured", !featured)}
                >
                  {featured ? "Unfeature" : "Feature"}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => toggleStaff("staffVerified", !staffVerified)}
                >
                  {staffVerified ? "Unverify" : "Staff verify"}
                </button>
              </>
            ) : null}
          </div>
        </div>

        <ShareButtons
          title={s.title}
          url={`https://robloxscripts.free/script/${s.id}`}
        />

        {s.description ? (
          <p style={{ color: "var(--ink-soft)", lineHeight: 1.6, maxWidth: "70ch" }}>
            {s.description}
          </p>
        ) : null}

        <AdUnit
          slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_SCRIPT || ""}
          className="ad-slot-script"
        />

        {game ? (
          <a
            className="play-game"
            href={game.playUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="play-game-thumb">
              {game.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={game.thumbnailUrl} alt={`${gameLabel} thumbnail`} width={120} height={120} />
              ) : (
                <div className="play-game-fallback">🎮</div>
              )}
            </div>
            <div className="play-game-copy">
              <span className="eyebrow">Open in Roblox</span>
              <strong>{gameLabel}</strong>
              <span className="muted">Click to play this game</span>
            </div>
            <span className="btn btn-primary play-game-btn">▶ Play game</span>
          </a>
        ) : null}

        <div className="detail-stats">
          <div>
            <b>{s.views}</b>
            <span>Views</span>
          </div>
          <div>
            <b>{likes}</b>
            <span>Likes</span>
          </div>
          <div>
            <b>{s.copies || 0}</b>
            <span>Copies</span>
          </div>
          <div>
            <b>{s.lines}</b>
            <span>Lines</span>
          </div>
          <div>
            <b>{fmtBytes(s.size)}</b>
            <span>Size</span>
          </div>
        </div>

        <div className="code-wrap">
          <div className="code-bar">
            <div className="dots">
              <i />
              <i />
              <i />
            </div>
            <div className="code-actions">
              <button type="button" onClick={copy}>
                📋 Copy
              </button>
              <a href={`/api/scripts/${s.id}/raw`}>
                <button type="button">⬇ Download</button>
              </a>
            </div>
          </div>
          <pre className="code">
            <code dangerouslySetInnerHTML={{ __html: html }} />
          </pre>
        </div>

        <CompatVotes
          scriptId={s.id}
          canVote={canVote}
          initialWorks={s.worksCount}
          initialBroken={s.brokenCount}
        />

        <CommentsSection scriptId={s.id} canComment={canComment} />
        <RecentlyViewed excludeId={s.id} />
      </div>
    </main>
  );
}
