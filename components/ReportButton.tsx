"use client";

import { FormEvent, useState } from "react";
import { useToast } from "@/components/ToastProvider";

export default function ReportButton({
  targetType,
  targetId,
  label = "Report",
  defaultReason = "spam",
}: {
  targetType: "script" | "user" | "comment";
  targetId: string;
  label?: string;
  defaultReason?: string;
}) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(defaultReason);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, reason, details }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Report failed");
      toast("Report submitted — thanks");
      setOpen(false);
      setDetails("");
    } catch (err) {
      toast((err as Error).message, true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>
        {label}
      </button>
      {open ? (
        <div className="crop-modal" role="dialog" aria-modal="true">
          <div className="crop-modal-panel">
            <div className="section-head" style={{ marginTop: 0 }}>
              <div>
                <span className="eyebrow">Safety</span>
                <h2>Report</h2>
                <p>Tell staff what’s wrong. False reports may be ignored.</p>
              </div>
            </div>
            <form className="form-grid" onSubmit={submit}>
              <div>
                <label>Reason</label>
                <select className="select" value={reason} onChange={(e) => setReason(e.target.value)}>
                  <option value="spam">Spam</option>
                  <option value="malware">Malware / steal</option>
                  <option value="broken">Broken / not working</option>
                  <option value="harassment">Harassment</option>
                  <option value="stolen">Stolen script</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label>Details</label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  maxLength={1000}
                  rows={4}
                  placeholder="Optional context…"
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy ? "Sending…" : "Submit report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
