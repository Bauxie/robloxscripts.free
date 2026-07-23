import Link from "next/link";
import { EXECUTORS } from "@/lib/executors";
import SponsorSlots from "@/components/SponsorSlots";

export const metadata = {
  title: "Executors — robloxscripts.free",
  description: "Find popular Roblox executors to run scripts from robloxscripts.free.",
};

function statusClass(status: string) {
  if (status === "Working") return "status-ok";
  if (status === "Updating") return "status-warn";
  return "status-bad";
}

export default function ExecutorsPage() {
  return (
    <main className="app">
      <Link href="/" className="back-link">
        ← Home
      </Link>

      <div className="section-head">
        <div>
          <span className="eyebrow">Run your scripts</span>
          <h2>⚙️ Executors</h2>
          <p>Pick an executor, then grab a script from the library and paste it in.</p>
        </div>
        <Link href="/scripts" className="btn btn-primary btn-sm">
          Browse scripts →
        </Link>
      </div>

      <SponsorSlots placement="executors" />

      <div className="exec-note panel">
        <b>Heads up:</b> Status badges change often after Roblox updates. Always download from the
        official site, use antivirus common sense, and never share account credentials.
      </div>

      <div className="grid exec-grid">
        {EXECUTORS.map((ex) => (
          <article key={ex.id} className="exec-card" style={{ ["--exec-color" as string]: ex.color }}>
            <div className="exec-top">
              <span className="exec-emoji" aria-hidden="true">
                {ex.emoji}
              </span>
              <span className={`exec-status ${statusClass(ex.status)}`}>{ex.status}</span>
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
    </main>
  );
}
