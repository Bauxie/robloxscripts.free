"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { ScriptView as ScriptViewType } from "@/lib/store";
import { timeAgo, fmtBytes, highlightLua } from "@/lib/format";
import { useToast } from "@/components/ToastProvider";

type GamePreview = {
  placeId: string;
  name: string | null;
  thumbnailUrl: string | null;
  playUrl: string;
};

export default function ScriptView({
  s,
  game,
}: {
  s: ScriptViewType;
  game?: GamePreview | null;
}) {
  const toast = useToast();
  const html = useMemo(() => highlightLua(s.code || ""), [s.code]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(s.code || "");
      toast("Copied to clipboard! 📋");
      fetch(`/api/scripts/${s.id}/copy`, { method: "POST" }).catch(() => {});
    } catch {
      toast("Copy failed — select manually", true);
    }
  }

  const gameLabel = game?.name || s.game || "Roblox game";

  return (
    <main className="app">
      <Link href="/scripts" className="back-link">
        ← All scripts
      </Link>
      <div className="panel">
        <div className="detail-head">
          <div>
            <h1>{s.title}</h1>
            <div className="detail-sub">
              by <b>@{s.author}</b> · {timeAgo(s.createdAt)}
              {s.game ? (
                <>
                  {" · "}
                  <Link href={`/scripts?q=${encodeURIComponent(s.game)}`}>🎮 {s.game}</Link>
                </>
              ) : null}
            </div>
            {s.tags?.length ? (
              <div className="tags">
                {s.tags.map((t) => (
                  <Link
                    key={t}
                    href={`/scripts?q=${encodeURIComponent(t)}`}
                    className="tag tag-link"
                  >
                    #{t}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
          <div className="detail-cta">
            <button type="button" className="btn btn-primary" onClick={copy}>
              📋 Copy script
            </button>
            <a className="btn btn-ghost" href={`/api/scripts/${s.id}/raw`}>
              ⬇ Download .lua
            </a>
          </div>
        </div>

        {s.description ? (
          <p style={{ color: "var(--ink-soft)", lineHeight: 1.6, maxWidth: "70ch" }}>
            {s.description}
          </p>
        ) : null}

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
      </div>
    </main>
  );
}
