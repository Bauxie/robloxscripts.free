import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export default async function Nav() {
  let profile: Awaited<ReturnType<typeof getCurrentProfile>> = null;
  try {
    profile = await getCurrentProfile();
  } catch {
    profile = null;
  }

  return (
    <header className="nav">
      <Link className="brand" href="/">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="brand-mark" src="/logo.png" alt="RS" width={42} height={42} />
        <span className="brand-name">
          robloxscripts.<b>free</b>
        </span>
      </Link>
      <nav className="nav-links">
        <Link href="/scripts">Scripts</Link>
        <Link href="/executors">Executors</Link>
        {profile ? (
          <>
            <Link href="/profile">@{profile.username}</Link>
            <Link href="/upload" className="btn btn-primary btn-sm">
              ＋ Upload
            </Link>
            <LogoutButton className="btn btn-ghost btn-sm" />
          </>
        ) : (
          <>
            <Link href="/login">Log in</Link>
            <Link href="/signup" className="btn btn-primary btn-sm">
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
