"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const KEY = "rs_recent_scripts";
const MAX = 12;

export type RecentItem = {
  id: string;
  title: string;
  at: number;
};

export function pushRecentScript(item: { id: string; title: string }) {
  try {
    const raw = localStorage.getItem(KEY);
    const list: RecentItem[] = raw ? JSON.parse(raw) : [];
    const next = [
      { id: item.id, title: item.title, at: Date.now() },
      ...list.filter((x) => x.id !== item.id),
    ].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export default function RecentlyViewed({ excludeId }: { excludeId?: string }) {
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const list: RecentItem[] = raw ? JSON.parse(raw) : [];
      setItems(list.filter((x) => x.id !== excludeId).slice(0, 6));
    } catch {
      setItems([]);
    }
  }, [excludeId]);

  if (!items.length) return null;

  return (
    <div className="recent-viewed">
      <h3>Recently viewed</h3>
      <ul>
        {items.map((i) => (
          <li key={i.id}>
            <Link href={`/script/${i.id}`}>{i.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
