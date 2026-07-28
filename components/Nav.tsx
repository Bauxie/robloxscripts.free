import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import MobileNav from "@/components/MobileNav";
import NavSearch from "@/components/NavSearch";

export default async function Nav() {
  let profile: Awaited<ReturnType<typeof getCurrentProfile>> = null;
  try {
    profile = await getCurrentProfile();
  } catch {
    profile = null;
  }

  return (
    <header className="nav">
      <div className="nav-left">
        <NavSearch />
        <Link className="brand" href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="brand-mark" src="/logo.png" alt="RS" width={42} height={42} />
          <span className="brand-name">
            robloxscripts.<b>free</b>
          </span>
        </Link>
      </div>
      <MobileNav profile={profile} />
    </header>
  );
}
