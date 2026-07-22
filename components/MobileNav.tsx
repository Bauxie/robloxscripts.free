"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Profile } from "@/lib/profile";
import { canModerate } from "@/lib/roles";
import LogoutButton from "@/components/LogoutButton";
import RoleBadges from "@/components/RoleBadges";
import NotificationsBell from "@/components/NotificationsBell";

export default function MobileNav({ profile }: { profile: Profile | null }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function close() {
    setOpen(false);
  }

  return (
    <>
      <div className="nav-actions">
        {profile ? <NotificationsBell /> : null}
        <button
          type="button"
          className={`nav-burger${open ? " is-open" : ""}`}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="site-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <nav
        id="site-menu"
        className={`nav-links${open ? " is-open" : ""}`}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a,button")) close();
        }}
      >
        <Link href="/scripts">Scripts</Link>
        <Link href="/executors">Executors</Link>
        <a
          href="https://discord.gg/TaX9wg9seD"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-discord"
        >
          Discord
        </a>
        {profile ? (
          <>
            {canModerate(profile.roles) ? <Link href="/admin">Admin</Link> : null}
            <span className="nav-bell-desktop">
              <NotificationsBell />
            </span>
            <Link href={`/u/${encodeURIComponent(profile.username)}`} className="nav-profile">
              <span className="nav-avatar">
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url} alt="" width={28} height={28} />
                ) : (
                  <span aria-hidden>{(profile.username[0] || "?").toUpperCase()}</span>
                )}
              </span>
              <span>@{profile.username}</span>
              <RoleBadges roles={profile.roles} size="sm" />
            </Link>
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

      {open ? (
        <button
          type="button"
          className="nav-backdrop"
          aria-label="Close menu"
          onClick={close}
        />
      ) : null}
    </>
  );
}
