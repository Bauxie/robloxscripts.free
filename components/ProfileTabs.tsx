"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ScriptView } from "@/lib/store";
import type { ProfileCommentActivity } from "@/lib/store";
import { fmtCompact, timeAgo } from "@/lib/format";
import ScriptCard from "@/components/ScriptCard";

export type ProfileTabId = "scripts" | "activity" | "statistics";

type Stats = {
  scripts: number;
  views: number;
  likes: number;
  copies: number;
  works: number;
  broken: number;
  followers: number;
  following: number;
  memberSince: string;
  bio: string;
};

export default function ProfileTabs({
  username,
  scripts,
  activity,
  stats,
  initialTab = "scripts",
}: {
  username: string;
  scripts: ScriptView[];
  activity: ProfileCommentActivity[];
  stats: Stats;
  initialTab?: ProfileTabId;
}) {
  const [tab, setTab] = useState<ProfileTabId>(
    initialTab === "activity" || initialTab === "statistics" ? initialTab : "scripts"
  );
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return scripts;
    return scripts.filter((s) => {
      const hay = `${s.title} ${s.game || ""} ${(s.tags || []).join(" ")}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [scripts, q]);

  const tabs: { id: ProfileTabId; label: string; icon: string }[] = [
    { id: "scripts", label: "Scripts", icon: "📜" },
    { id: "activity", label: "Activity", icon: "⚡" },
    { id: "statistics", label: "Statistics", icon: "📊" },
  ];

  return (
    <div className="profile-tabs-wrap">
      <div className="profile-stat-strip" aria-label="Profile stats">
        <div>
          <b>{fmtCompact(stats.followers)}</b>
          <span>Followers</span>
        </div>
        <div>
          <b>{fmtCompact(stats.following)}</b>
          <span>Following</span>
        </div>
        <div>
          <b>{fmtCompact(stats.scripts)}</b>
          <span>Scripts</span>
        </div>
        <div>
          <b>{fmtCompact(stats.views)}</b>
          <span>Views</span>
        </div>
      </div>

      <nav className="profile-tabs" aria-label="Profile sections">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`profile-tab${tab === t.id ? " is-active" : ""}`}
            onClick={() => setTab(t.id)}
            aria-selected={tab === t.id}
          >
            <span aria-hidden>{t.icon}</span> {t.label}
          </button>
        ))}
      </nav>

      {tab === "scripts" ? (
        <section className="profile-tab-panel">
          <div className="profile-tab-toolbar">
            <div>
              <h2>Scripts</h2>
              <p>
                {stats.scripts} published by @{username}
              </p>
            </div>
            {scripts.length > 3 ? (
              <div className="search profile-script-search">
                <span>🔎</span>
                <input
                  type="search"
                  placeholder="Search scripts…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  aria-label="Search this creator’s scripts"
                />
              </div>
            ) : null}
          </div>

          {filtered.length ? (
            <>
              <p className="profile-section-label">Recent</p>
              <div className="grid">
                {filtered.map((s) => (
                  <ScriptCard key={s.id} s={s} />
                ))}
              </div>
            </>
          ) : (
            <div className="empty">
              <div className="big">🏝️</div>
              <h3>{scripts.length ? "No matching scripts" : "No scripts yet"}</h3>
            </div>
          )}
        </section>
      ) : null}

      {tab === "activity" ? (
        <section className="profile-tab-panel">
          <div className="profile-tab-toolbar">
            <div>
              <h2>Activity</h2>
              <p>Comment history from @{username}</p>
            </div>
            <span className="profile-count-pill">{activity.length} total</span>
          </div>

          <p className="profile-section-label">Comment history</p>

          {activity.length ? (
            <ul className="profile-activity-list">
              {activity.map((item) => (
                <li key={item.id} className="profile-activity-item">
                  <div className="profile-activity-meta">
                    <b>@{username}</b>
                    <span>· {timeAgo(item.createdAt)}</span>
                  </div>
                  <p className="profile-activity-body">{item.body}</p>
                  <Link href={`/script/${item.scriptId}`} className="profile-activity-script">
                    <div>
                      <strong>{item.scriptTitle}</strong>
                      {item.scriptGame ? <span className="muted">{item.scriptGame}</span> : null}
                    </div>
                    <span>View conversation →</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty">
              <div className="big">💬</div>
              <h3>No comments yet</h3>
            </div>
          )}
        </section>
      ) : null}

      {tab === "statistics" ? (
        <section className="profile-tab-panel">
          <div className="profile-tab-toolbar">
            <div>
              <h2>Statistics</h2>
              <p>Totals across all scripts uploaded by @{username}</p>
            </div>
          </div>

          {stats.bio ? (
            <div className="profile-about-block">
              <p className="profile-section-label">About</p>
              <p>{stats.bio}</p>
            </div>
          ) : null}

          <div className="profile-metrics">
            <div>
              <span>Scripts</span>
              <b>{fmtCompact(stats.scripts)}</b>
            </div>
            <div>
              <span>Views</span>
              <b>{fmtCompact(stats.views)}</b>
            </div>
            <div>
              <span>Likes</span>
              <b>{fmtCompact(stats.likes)}</b>
            </div>
            <div>
              <span>Copies</span>
              <b>{fmtCompact(stats.copies)}</b>
            </div>
            <div>
              <span>Works votes</span>
              <b>{fmtCompact(stats.works)}</b>
            </div>
            <div>
              <span>Broken votes</span>
              <b>{fmtCompact(stats.broken)}</b>
            </div>
          </div>

          <dl className="profile-stat-details">
            <div>
              <dt>Member since</dt>
              <dd>
                {stats.memberSince
                  ? new Date(stats.memberSince).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "—"}
              </dd>
            </div>
            <div>
              <dt>Followers</dt>
              <dd>{fmtCompact(stats.followers)}</dd>
            </div>
            <div>
              <dt>Following</dt>
              <dd>{fmtCompact(stats.following)}</dd>
            </div>
            <div>
              <dt>Total script views</dt>
              <dd>{stats.views.toLocaleString()}</dd>
            </div>
          </dl>
        </section>
      ) : null}
    </div>
  );
}
