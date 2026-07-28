"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function NavSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    // Focus after the expand animation starts so the caret is visible
    const t = setTimeout(() => inputRef.current?.focus(), 80);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [open]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const query = q.trim();
    setOpen(false);
    router.push(query ? `/scripts?q=${encodeURIComponent(query)}` : "/scripts");
  }

  return (
    <div ref={wrapRef} className={`nav-search${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="nav-search-btn"
        aria-label={open ? "Close search" : "Open search"}
        aria-expanded={open}
        aria-controls="nav-search-input"
        onClick={() => setOpen((v) => !v)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden>
          <circle cx="10.5" cy="10.5" r="6.5" />
          <line x1="15.5" y1="15.5" x2="21" y2="21" />
        </svg>
      </button>
      <form className="nav-search-form" onSubmit={submit}>
        <input
          id="nav-search-input"
          ref={inputRef}
          type="search"
          className="nav-search-input"
          placeholder="Search scripts…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          tabIndex={open ? 0 : -1}
          aria-hidden={!open}
          autoComplete="off"
        />
      </form>
    </div>
  );
}
