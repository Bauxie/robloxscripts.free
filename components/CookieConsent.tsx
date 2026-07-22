"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const KEY = "rs_cookie_consent";

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  function accept() {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      // ignore
    }
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Cookie notice">
      <p>
        We use cookies for login and — if ads are enabled — to help Google show and measure ads.
        See our <Link href="/privacy">Privacy Policy</Link>.
      </p>
      <button type="button" className="btn btn-primary btn-sm" onClick={accept}>
        Got it
      </button>
    </div>
  );
}
