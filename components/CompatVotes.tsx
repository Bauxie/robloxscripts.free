"use client";

import { useEffect, useState } from "react";
import { EXECUTORS } from "@/lib/executors";
import { useToast } from "@/components/ToastProvider";

export default function CompatVotes({
  scriptId,
  canVote,
  initialWorks = 0,
  initialBroken = 0,
}: {
  scriptId: string;
  canVote: boolean;
  initialWorks?: number;
  initialBroken?: number;
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
      setByExecutor((prev) => {
        const cur = { ...(prev[executorId] || { works: 0, broken: 0 }) };
        // optimistic recount from server totals only; refresh list
        return prev;
      });
      const refresh = await fetch(`/api/scripts/${scriptId}/votes`);
      if (refresh.ok) {
        const d = await refresh.json();
        setByExecutor(d.byExecutor || {});
      }
    } catch (e) {
      toast((e as Error).message, true);
    }
  }

  const stats = byExecutor[executorId];

  return (
    <div className="compat-votes panel-inset">
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
              {ex.emoji} {ex.name}
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
    </div>
  );
}
