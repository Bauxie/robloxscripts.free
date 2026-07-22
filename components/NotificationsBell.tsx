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

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);

  async function load() {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.notifications || []);
      setUnread(data.unread || 0);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  async function markAll() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    setUnread(0);
    setItems((list) => list.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
  }

  return (
    <div className="notif-wrap">
      <button
        type="button"
        className="btn btn-ghost btn-sm notif-bell"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) load();
        }}
        aria-label="Notifications"
      >
        🔔{unread > 0 ? <span className="notif-dot">{unread > 9 ? "9+" : unread}</span> : null}
      </button>
      {open ? (
        <div className="notif-dropdown">
          <div className="notif-dropdown-head">
            <strong>Notifications</strong>
            <button type="button" className="btn btn-ghost btn-sm" onClick={markAll}>
              Mark all read
            </button>
          </div>
          {items.length === 0 ? (
            <p className="hint" style={{ padding: 12 }}>
              You’re all caught up.
            </p>
          ) : (
            <ul className="notif-list">
              {items.slice(0, 12).map((n) => (
                <li key={n.id} className={!n.read_at ? "is-unread" : ""}>
                  {n.href ? (
                    <Link href={n.href} onClick={() => setOpen(false)}>
                      <b>{n.title}</b>
                      <span>{n.body}</span>
                      <small>{timeAgo(n.created_at)}</small>
                    </Link>
                  ) : (
                    <div>
                      <b>{n.title}</b>
                      <span>{n.body}</span>
                      <small>{timeAgo(n.created_at)}</small>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          <Link className="notif-all" href="/notifications" onClick={() => setOpen(false)}>
            View all
          </Link>
        </div>
      ) : null}
    </div>
  );
}
