"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ScriptView } from "@/lib/store";
import ScriptCard from "@/components/ScriptCard";

export default function FavoritesClient() {
  const [scripts, setScripts] = useState<ScriptView[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/favorites")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
        setScripts(data.favorites || []);
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
          <span className="eyebrow">Saved</span>
          <h2>⭐ Favorites</h2>
          <p>Scripts you’ve bookmarked for later.</p>
        </div>
      </div>
      {scripts === null ? (
        <div className="loading">
          <div className="spinner" />
        </div>
      ) : error ? (
        <div className="empty">
          <p>{error}</p>
          <Link href="/login?next=/favorites" className="btn btn-primary" style={{ marginTop: 12 }}>
            Log in
          </Link>
        </div>
      ) : scripts.length === 0 ? (
        <div className="empty">
          <div className="big">⭐</div>
          <h3>No favorites yet</h3>
          <p>Tap the star on a script page to save it here.</p>
          <Link href="/scripts" className="btn btn-primary" style={{ marginTop: 16 }}>
            Browse scripts
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
