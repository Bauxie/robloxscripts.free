"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { EXECUTORS, isFreePrice, type Executor } from "@/lib/executors";
import ExecutorLogo from "@/components/ExecutorLogo";

type PriceFilter = "all" | "free" | "paid";
type UpdateFilter = "all" | "updated" | "not-updated";

function updateClass(status: Executor["updateStatus"]) {
  return status === "Updated" ? "status-ok" : "status-bad";
}

export default function ExecutorsClient() {
  const [price, setPrice] = useState<PriceFilter>("all");
  const [update, setUpdate] = useState<UpdateFilter>("all");

  const list = useMemo(() => {
    return EXECUTORS.filter((ex) => {
      if (price === "free" && !isFreePrice(ex.price)) return false;
      if (price === "paid" && ex.price !== "Paid") return false;
      if (update === "updated" && ex.updateStatus !== "Updated") return false;
      if (update === "not-updated" && ex.updateStatus !== "Not updated") return false;
      return true;
    });
  }, [price, update]);

  return (
    <>
      <div className="exec-filters">
        <div className="exec-filter-group" role="group" aria-label="Price filter">
          <button
            type="button"
            className={`btn btn-sm${price === "all" ? " btn-primary" : " btn-ghost"}`}
            onClick={() => setPrice("all")}
          >
            All
          </button>
          <button
            type="button"
            className={`btn btn-sm${price === "free" ? " btn-primary" : " btn-ghost"}`}
            onClick={() => setPrice("free")}
          >
            Free
          </button>
          <button
            type="button"
            className={`btn btn-sm${price === "paid" ? " btn-primary" : " btn-ghost"}`}
            onClick={() => setPrice("paid")}
          >
            Paid
          </button>
        </div>
        <div className="exec-filter-group" role="group" aria-label="Update status filter">
          <button
            type="button"
            className={`btn btn-sm${update === "all" ? " btn-primary" : " btn-ghost"}`}
            onClick={() => setUpdate("all")}
          >
            Any status
          </button>
          <button
            type="button"
            className={`btn btn-sm${update === "updated" ? " btn-primary" : " btn-ghost"}`}
            onClick={() => setUpdate("updated")}
          >
            Updated
          </button>
          <button
            type="button"
            className={`btn btn-sm${update === "not-updated" ? " btn-primary" : " btn-ghost"}`}
            onClick={() => setUpdate("not-updated")}
          >
            Not updated
          </button>
        </div>
      </div>

      {list.length ? (
        <div className="grid exec-grid">
          {list.map((ex) => (
            <article
              key={ex.id}
              className={`exec-card${ex.recommended ? " exec-card-recommended" : ""}`}
              style={{ ["--exec-color" as string]: ex.color }}
            >
              <div className="exec-top">
                <ExecutorLogo executor={ex} size={52} className="exec-logo-lg" />
                <div className="exec-badges">
                  {ex.recommended ? (
                    <span className="exec-status exec-recommended">Recommended</span>
                  ) : null}
                  <span className={`exec-status ${updateClass(ex.updateStatus)}`}>
                    {ex.updateStatus}
                  </span>
                </div>
              </div>
              <h3>{ex.name}</h3>
              <p className="exec-tagline">{ex.tagline}</p>
              <div className="exec-meta">
                <span className="tag">{ex.price}</span>
                {ex.platform.map((p) => (
                  <span className="tag" key={p}>
                    {p}
                  </span>
                ))}
              </div>
              <ul className="exec-features">
                {ex.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              {ex.website !== "#" ? (
                <a
                  className="btn btn-primary btn-sm"
                  href={ex.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visit site ↗
                </a>
              ) : (
                <span className="btn btn-ghost btn-sm" style={{ opacity: 0.7, cursor: "default" }}>
                  Link coming soon
                </span>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="empty">
          <div className="big">⚙️</div>
          <h3>No executors match</h3>
          <p>Try clearing a filter.</p>
        </div>
      )}

      <div className="section-head" style={{ marginTop: 48 }}>
        <div>
          <h2>How it works</h2>
          <p>Three splashy steps and you’re scripting.</p>
        </div>
      </div>
      <div className="how-grid">
        <div className="how-step">
          <span className="how-num">1</span>
          <h3>Get an executor</h3>
          <p>Download one from the list above that matches your device.</p>
        </div>
        <div className="how-step">
          <span className="how-num">2</span>
          <h3>Find a script</h3>
          <p>
            Head to <Link href="/scripts">Scripts</Link> and search your game.
          </p>
        </div>
        <div className="how-step">
          <span className="how-num">3</span>
          <h3>Copy &amp; execute</h3>
          <p>Copy the code, paste it into the executor, and hit execute.</p>
        </div>
      </div>
    </>
  );
}
