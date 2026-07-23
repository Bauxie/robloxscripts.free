"use client";

import { useEffect, useState } from "react";

const KEY = "rs_theme";

export default function DarkModeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      const prefer =
        saved === "dark" ||
        (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
      setDark(prefer);
      document.documentElement.classList.toggle("theme-dark", prefer);
    } catch {
      // ignore
    }
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("theme-dark", next);
    try {
      localStorage.setItem(KEY, next ? "dark" : "light");
    } catch {
      // ignore
    }
  }

  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm theme-toggle"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
