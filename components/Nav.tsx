import Link from "next/link";

export default function Nav() {
  return (
    <header className="nav">
      <Link className="brand" href="/">
        <span className="brand-mark">🌊</span>
        <span className="brand-name">
          robloxscripts.<b>free</b>
        </span>
      </Link>
      <nav className="nav-links">
        <Link href="/scripts">Scripts</Link>
        <Link href="/executors">Executors</Link>
        <Link href="/upload" className="btn btn-primary btn-sm">
          ＋ Upload
        </Link>
      </nav>
    </header>
  );
}
