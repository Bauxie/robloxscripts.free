"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ScriptView } from "@/lib/store";
import ScriptCard from "@/components/ScriptCard";
import { EXECUTORS } from "@/lib/executors";

export default function ScriptsClient() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";
  const initialSort = searchParams.get("sort") || "new";
  const initialGame = searchParams.get("game") || "";
  const initialTag = searchParams.get("tag") || "";
  const initialExecutor = searchParams.get("executor") || "";
  const initialVerified = searchParams.get("verified") === "1";

  const [q, setQ] = useState(initialQ);
  const [sort, setSort] = useState(initialSort);
  const [game, setGame] = useState(initialGame);
  const [tag, setTag] = useState(initialTag);
  const [executor, setExecutor] = useState(initialExecutor);
  const [verified, setVerified] = useState(initialVerified);
  const [scripts, setScripts] = useState<ScriptView[] | null>(null);
  const [error, setError] = useState("");
  const deb = useRef<ReturnType<typeof setTimeout>>();

  async function load(opts: {
    query: string;
    sortBy: string;
    gameF: string;
    tagF: string;
    executorF: string;
    verifiedF: boolean;
  }) {
    setError("");
    try {
      const params = new URLSearchParams();
      if (opts.query) params.set("q", opts.query);
      if (opts.sortBy) params.set("sort", opts.sortBy);
      if (opts.gameF) params.set("game", opts.gameF);
      if (opts.tagF) params.set("tag", opts.tagF);
      if (opts.executorF) params.set("executor", opts.executorF);
      if (opts.verifiedF) params.set("verified", "1");
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
    setGame(initialGame);
    setTag(initialTag);
    setExecutor(initialExecutor);
    setVerified(initialVerified);
    load({
      query: initialQ,
      sortBy: initialSort,
      gameF: initialGame,
      tagF: initialTag,
      executorF: initialExecutor,
      verifiedF: initialVerified,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQ, initialSort, initialGame, initialTag, initialExecutor, initialVerified]);

  function reload(next?: Partial<{ q: string; sort: string; game: string; tag: string; executor: string; verified: boolean }>) {
    const opts = {
      query: next?.q ?? q,
      sortBy: next?.sort ?? sort,
      gameF: next?.game ?? game,
      tagF: next?.tag ?? tag,
      executorF: next?.executor ?? executor,
      verifiedF: next?.verified ?? verified,
    };
    load(opts);
  }

  function onSearch(value: string) {
    setQ(value);
    clearTimeout(deb.current);
    deb.current = setTimeout(() => reload({ q: value }), 220);
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
          <p>Search and filter by game, tags, executors, and verified creators.</p>
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
        <select
          className="select"
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            reload({ sort: e.target.value });
          }}
        >
          <option value="new">Newest</option>
          <option value="popular">Most viewed</option>
          <option value="likes">Most liked</option>
          <option value="copies">Most copied</option>
        </select>
      </div>

      <div className="filters-row">
        <input
          type="text"
          placeholder="Filter by game…"
          value={game}
          onChange={(e) => {
            setGame(e.target.value);
            clearTimeout(deb.current);
            deb.current = setTimeout(() => reload({ game: e.target.value }), 220);
          }}
        />
        <input
          type="text"
          placeholder="Filter by tag…"
          value={tag}
          onChange={(e) => {
            setTag(e.target.value);
            clearTimeout(deb.current);
            deb.current = setTimeout(() => reload({ tag: e.target.value }), 220);
          }}
        />
        <select
          className="select"
          value={executor}
          onChange={(e) => {
            setExecutor(e.target.value);
            reload({ executor: e.target.value });
          }}
        >
          <option value="">Any executor</option>
          {EXECUTORS.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
            </option>
          ))}
        </select>
        <label className="filter-check">
          <input
            type="checkbox"
            checked={verified}
            onChange={(e) => {
              setVerified(e.target.checked);
              reload({ verified: e.target.checked });
            }}
          />
          Verified only
        </label>
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
          <h3>No scripts match</h3>
          <p>Try clearing a filter or searching something else.</p>
        </div>
      ) : (
        <>
          <p className="result-count">
            {scripts.length} script{scripts.length === 1 ? "" : "s"}
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
