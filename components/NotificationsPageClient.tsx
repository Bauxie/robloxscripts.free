"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { timeAgo } from "@/lib/format";

type Notif = {
  id: string;
  title: string;
  body: string;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

export default function NotificationsPageClient() {
  const [items, setItems] = useState<Notif[] | null>(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setItems(data.notifications || []);
    } catch (e) {
      setError((e as Error).message);
      setItems([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function markAll() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    setItems((list) =>
      (list || []).map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
    );
  }

  async function markOne(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setItems((list) =>
      (list || []).map((n) =>
        n.id === id ? { ...n, read_at: n.read_at || new Date().toISOString() } : n
      )
    );
  }

  return (
    <main className="app">
      <Link href="/" className="back-link">
        ← Home
      </Link>

      <div className="section-head">
        <div>
          <span className="eyebrow">Inbox</span>
          <h2>🔔 Notifications</h2>
          <p>Comments, likes, and report updates.</p>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={markAll}>
          Mark all read
        </button>
      </div>

      {items === null ? (
        <div className="loading">
          <div className="spinner" />
          Loading…
        </div>
      ) : error ? (
        <div className="empty">
          <div className="big">⚠️</div>
          <p>{error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="empty">
          <div className="big">🏝️</div>
          <h3>You’re all caught up</h3>
        </div>
      ) : (
        <ul className="notif-page-list">
          {items.map((n) => (
            <li key={n.id} className={!n.read_at ? "is-unread" : ""}>
              {n.href ? (
                <Link href={n.href} onClick={() => markOne(n.id)}>
                  <b>{n.title}</b>
                  <span>{n.body}</span>
                  <small>{timeAgo(n.created_at)}</small>
                </Link>
              ) : (
                <button type="button" onClick={() => markOne(n.id)}>
                  <b>{n.title}</b>
                  <span>{n.body}</span>
                  <small>{timeAgo(n.created_at)}</small>
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
