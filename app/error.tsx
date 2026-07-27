"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error for debugging / analytics.
    console.error(error);
  }, [error]);

  return (
    <main className="app">
      <div className="empty">
        <div className="big">🏝️</div>
        <h3>Something went wrong</h3>
        <p>
          A wave knocked this page over. Try again, and if it keeps happening let us know.
        </p>
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 16,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <button type="button" className="btn btn-primary" onClick={() => reset()}>
            ↻ Try again
          </button>
          <Link href="/" className="btn btn-ghost">
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
