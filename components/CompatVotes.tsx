"use client";

import { useEffect, useState } from "react";
import { EXECUTORS } from "@/lib/executors";
import { useToast } from "@/components/ToastProvider";

function CompatVoteBody({
  scriptId,
  canVote,
  loggedIn,
  initialWorks = 0,
  initialBroken = 0,
  onVoted,
}: {
  scriptId: string;
  canVote: boolean;
  loggedIn: boolean;
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
    if (!loggedIn) {
      toast("Log in to vote", true);
      return;
    }
    if (!canVote) {
      toast("You can’t vote on your own script.", true);
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
      <label className="compat-executor">
        <span>Which executor did you use?</span>
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
      </label>
      <div className="compat-choice-grid">
        <button
          type="button"
          className="compat-choice compat-choice-works"
          onClick={() => vote("works")}
        >
          <span className="compat-choice-icon" aria-hidden>🔥</span>
          <strong>Works Great</strong>
        </button>
        <button
          type="button"
          className="compat-choice compat-choice-broken"
          onClick={() => vote("broken")}
        >
          <span className="compat-choice-icon" aria-hidden>🥶</span>
          <strong>Not Working</strong>
        </button>
      </div>
      <p className="compat-stats hint">
        {stats
          ? `On this executor: ${stats.works} works · ${stats.broken} broken`
          : `${works} working · ${broken} broken overall`}
      </p>
    </>
  );
}

export default function CompatVotes({
  scriptId,
  canVote,
  loggedIn = false,
  initialWorks = 0,
  initialBroken = 0,
  open = false,
  onClose,
  onNeverShow,
}: {
  scriptId: string;
  canVote: boolean;
  loggedIn?: boolean;
  initialWorks?: number;
  initialBroken?: number;
  open?: boolean;
  onClose?: () => void;
  onNeverShow?: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="crop-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="compat-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="crop-modal-panel compat-modal-panel">
        <button
          type="button"
          className="compat-close"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>
        <div className="compat-modal-head">
          <span className="compat-modal-icon" aria-hidden>💬</span>
          <div>
            <h2 id="compat-title">Did this script work?</h2>
            <p>Help the community discover reliable scripts by sharing your experience.</p>
          </div>
        </div>
        <div className="compat-votes-modal">
          <CompatVoteBody
            scriptId={scriptId}
            canVote={canVote}
            loggedIn={loggedIn}
            initialWorks={initialWorks}
            initialBroken={initialBroken}
            onVoted={onClose}
          />
        </div>
        <div className="compat-skip">
          <button type="button" onClick={onClose}>
            Skip feedback
          </button>
          <label>
            <input
              type="checkbox"
              onChange={(event) => {
                if (event.target.checked) onNeverShow?.();
              }}
            />
            Don&apos;t show this again
          </label>
        </div>
      </div>
    </div>
  );
}
