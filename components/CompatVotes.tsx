"use client";

import { useEffect, useState } from "react";
import { EXECUTORS } from "@/lib/executors";
import { useToast } from "@/components/ToastProvider";

function CompatVoteBody({
  scriptId,
  canVote,
  initialWorks = 0,
  initialBroken = 0,
  onVoted,
}: {
  scriptId: string;
  canVote: boolean;
  initialWorks?: number;
  initialBroken?: number;
  onVoted?: () => void;
}) {
  const toast = useToast();
  const [executorId, setExecutorId] = useState(EXECUTORS[0]?.id || "solara");
  const [works, setWorks] = useState(initialWorks);
  const [broken, setBroken] = useState(initialBroken);
  const [byExecutor, setByExecutor] = useState<
    Record<string, { works: number; broken: number }>
  >({});

  useEffect(() => {
    fetch(`/api/scripts/${scriptId}/votes`)
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        setByExecutor(data.byExecutor || {});
      })
      .catch(() => {});

    try {
      const pref = localStorage.getItem("rs_executor_pref");
      if (pref) setExecutorId(pref);
    } catch {
      // ignore
    }
  }, [scriptId]);

  async function vote(v: "works" | "broken") {
    if (!canVote) {
      toast("Log in to vote", true);
      return;
    }
    try {
      localStorage.setItem("rs_executor_pref", executorId);
    } catch {
      // ignore
    }
    try {
      const res = await fetch(`/api/scripts/${scriptId}/votes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ executorId, vote: v }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Vote failed");
      setWorks(data.works ?? works);
      setBroken(data.broken ?? broken);
      toast(v === "works" ? "Marked as working ✓" : "Marked as broken");
      const refresh = await fetch(`/api/scripts/${scriptId}/votes`);
      if (refresh.ok) {
        const d = await refresh.json();
        setByExecutor(d.byExecutor || {});
      }
      onVoted?.();
    } catch (e) {
      toast((e as Error).message, true);
    }
  }

  const stats = byExecutor[executorId];

  return (
    <>
      <div className="compat-head">
        <strong>Does it work?</strong>
        <span className="hint">
          {works} working · {broken} broken overall
        </span>
      </div>
      <div className="compat-controls">
        <select
          className="select"
          value={executorId}
          onChange={(e) => setExecutorId(e.target.value)}
        >
          {EXECUTORS.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => vote("works")}>
          Works
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => vote("broken")}>
          Broken
        </button>
      </div>
      {stats ? (
        <p className="hint" style={{ marginTop: 8 }}>
          On this executor: {stats.works} works · {stats.broken} broken
        </p>
      ) : null}
    </>
  );
}

export default function CompatVotes({
  scriptId,
  canVote,
  initialWorks = 0,
  initialBroken = 0,
  open = false,
  onClose,
}: {
  scriptId: string;
  canVote: boolean;
  initialWorks?: number;
  initialBroken?: number;
  open?: boolean;
  onClose?: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="crop-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Does it work?"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="crop-modal-panel compat-modal-panel">
        <div className="section-head" style={{ marginTop: 0 }}>
          <div>
            <span className="eyebrow">Copied</span>
            <h2>Does it work?</h2>
            <p>After you try it, tell others if this script runs on your executor.</p>
          </div>
        </div>
        <div className="compat-votes compat-votes-modal">
          <CompatVoteBody
            scriptId={scriptId}
            canVote={canVote}
            initialWorks={initialWorks}
            initialBroken={initialBroken}
            onVoted={onClose}
          />
        </div>
        <div className="form-actions" style={{ marginTop: 16 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
