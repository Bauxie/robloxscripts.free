"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ScriptView } from "@/lib/store";
import ScriptCard from "@/components/ScriptCard";

export default function FeedClient() {
  const [scripts, setScripts] = useState<ScriptView[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/follows?feed=1")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
        setScripts(data.scripts || []);
      })
      .catch((e) => {
        setError((e as Error).message);
        setScripts([]);
      });
  }, []);

  return (
    <main className="app">
      <Link href="/" className="back-link">
        ← Home
      </Link>
      <div className="section-head">
        <div>
          <span className="eyebrow">Following</span>
          <h2>📡 Creator feed</h2>
          <p>New uploads from people you follow.</p>
        </div>
      </div>
      {scripts === null ? (
        <div className="loading">
          <div className="spinner" />
        </div>
      ) : error ? (
        <div className="empty">
          <p>{error}</p>
          <Link href="/login?next=/feed" className="btn btn-primary" style={{ marginTop: 12 }}>
            Log in
          </Link>
        </div>
      ) : scripts.length === 0 ? (
        <div className="empty">
          <div className="big">📡</div>
          <h3>Your feed is quiet</h3>
          <p>Follow creators on their profile pages to see uploads here.</p>
          <Link href="/scripts" className="btn btn-primary" style={{ marginTop: 16 }}>
            Discover scripts
          </Link>
        </div>
      ) : (
        <div className="grid">
          {scripts.map((s) => (
            <ScriptCard key={s.id} s={s} />
          ))}
        </div>
      )}
    </main>
  );
}
