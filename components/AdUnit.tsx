"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/** Place an AdSense display unit. Requires a slot id (and the site-wide AdSense loader). */
export default function AdUnit({
  slot,
  format = "auto",
  responsive = true,
  className = "",
}: {
  slot: string;
  format?: string;
  responsive?: boolean;
  className?: string;
}) {
  const client = (process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-9808155078584354").trim();
  const pushed = useRef(false);

  useEffect(() => {
    if (!client || !slot || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // Ad blockers / not approved yet
    }
  }, [client, slot]);

  if (!client || !slot) return null;

  return (
    <div className={`ad-unit ${className}`.trim()} aria-hidden>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}
