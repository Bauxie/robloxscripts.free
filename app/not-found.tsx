import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="app">
      <div className="empty">
        <div className="big">🌊</div>
        <h3>Page not found</h3>
        <p>This one drifted out to sea. Let&apos;s get you back to shore.</p>
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 16,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <Link href="/" className="btn btn-primary">
            🏠 Home
          </Link>
          <Link href="/scripts" className="btn btn-ghost">
            Browse scripts
          </Link>
        </div>
      </div>
    </main>
  );
}
