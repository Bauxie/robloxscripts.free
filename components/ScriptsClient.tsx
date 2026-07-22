"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ScriptView } from "@/lib/store";
import ScriptCard from "@/components/ScriptCard";

export default function ScriptsClient() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";
  const initialSort = searchParams.get("sort") || "new";

  const [q, setQ] = useState(initialQ);
  const [sort, setSort] = useState(initialSort);
  const [scripts, setScripts] = useState<ScriptView[] | null>(null);
  const [error, setError] = useState("");
  const deb = useRef<ReturnType<typeof setTimeout>>();

  async function load(query: string, sortBy: string) {
    setError("");
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (sortBy) params.set("sort", sortBy);
      const res = await fetch("/api/scripts?" + params.toString());
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setScripts(data);
    } catch (e) {
      setError((e as Error).message);
      setScripts([]);
    }
  }

  useEffect(() => {
    setQ(initialQ);
    setSort(initialSort);
    load(initialQ, initialSort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQ, initialSort]);

  function onSearch(value: string) {
    setQ(value);
    clearTimeout(deb.current);
    deb.current = setTimeout(() => load(value, sort), 220);
  }

  function onSort(value: string) {
    setSort(value);
    load(q, value);
  }

  return (
    <main className="app">
      <Link href="/" className="back-link">
        ← Home
      </Link>
      <div className="section-head">
        <div>
          <span className="eyebrow">Community library</span>
          <h2>📜 Scripts</h2>
          <p>Search by game, author, tag, or title — then copy and run.</p>
        </div>
        <Link href="/upload" className="btn btn-primary btn-sm">
          ＋ Upload
        </Link>
      </div>

      <div className="toolbar">
        <div className="search">
          🔎
          <input
            type="text"
            placeholder="Search scripts, games, authors, tags…"
            value={q}
            onChange={(e) => onSearch(e.target.value)}
            autoFocus
          />
        </div>
        <select className="select" value={sort} onChange={(e) => onSort(e.target.value)}>
          <option value="new">Newest</option>
          <option value="popular">Most viewed</option>
          <option value="copies">Most copied</option>
        </select>
      </div>

      {scripts === null ? (
        <div className="loading">
          <div className="spinner" />
          Loading…
        </div>
      ) : error ? (
        <div className="empty">
          <div className="big">⚠️</div>
          <p>{error}</p>
        </div>
      ) : scripts.length === 0 ? (
        <div className="empty">
          <div className="big">🏝️</div>
          <h3>{q ? "No scripts match your search" : "No scripts yet"}</h3>
          <p>{q ? "Try a different keyword." : "Be the first to ride the wave."}</p>
          <Link href="/upload" className="btn btn-primary" style={{ marginTop: 16 }}>
            ＋ Upload a script
          </Link>
        </div>
      ) : (
        <>
          <p className="result-count">
            {scripts.length} script{scripts.length === 1 ? "" : "s"}
            {q ? ` matching “${q}”` : ""}
          </p>
          <div className="grid">
            {scripts.map((s) => (
              <ScriptCard key={s.id} s={s} hot={sort === "popular" && (s.views || 0) > 10} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
