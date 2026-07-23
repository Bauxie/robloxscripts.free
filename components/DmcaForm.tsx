"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/ToastProvider";

export default function DmcaForm() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/dmca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          urls: fd.get("urls"),
          details: fd.get("details"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setDone(true);
      toast("Takedown request submitted");
    } catch (err) {
      toast((err as Error).message, true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="app">
      <Link href="/" className="back-link">
        ← Home
      </Link>
      <article className="panel legal-doc">
        <div className="section-head" style={{ marginTop: 0 }}>
          <div>
            <span className="eyebrow">Legal</span>
            <h1>DMCA / Takedown</h1>
            <p>
              Report copyright infringement or request removal. Include URLs and proof of ownership.
              See also our <Link href="/terms">Terms</Link> and <Link href="/contact">Contact</Link>.
            </p>
          </div>
        </div>

        {done ? (
          <div className="empty">
            <div className="big">✅</div>
            <h3>Request received</h3>
            <p>Staff will review and respond by email when possible.</p>
          </div>
        ) : (
          <form className="form-grid" onSubmit={onSubmit}>
            <div className="row2">
              <div>
                <label>
                  Full name <span className="req">*</span>
                </label>
                <input name="name" required maxLength={120} />
              </div>
              <div>
                <label>
                  Email <span className="req">*</span>
                </label>
                <input name="email" type="email" required maxLength={200} />
              </div>
            </div>
            <div>
              <label>
                URLs of content <span className="req">*</span>
              </label>
              <textarea
                name="urls"
                required
                rows={4}
                placeholder="https://robloxscripts.free/script/…"
                maxLength={4000}
              />
            </div>
            <div>
              <label>Details / ownership statement</label>
              <textarea name="details" rows={5} maxLength={4000} />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? "Sending…" : "Submit request"}
              </button>
            </div>
          </form>
        )}
      </article>
    </main>
  );
}
