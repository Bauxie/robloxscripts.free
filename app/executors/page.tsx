import Link from "next/link";
import SponsorSlots from "@/components/SponsorSlots";
import ExecutorsClient from "@/components/ExecutorsClient";

export const metadata = {
  title: "Executors — robloxscripts.free",
  description: "Find popular Roblox executors to run scripts from robloxscripts.free.",
};

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
          <p>
            Velocity is our recommended pick. Filter by free/paid and see which ones are updated for
            the current Roblox build.
          </p>
        </div>
        <Link href="/scripts" className="btn btn-primary btn-sm">
          Browse scripts →
        </Link>
      </div>

      <SponsorSlots placement="executors" />

      <div className="exec-note panel">
        <b>Heads up:</b> <b>Updated</b> means it supports the current Roblox version;{" "}
        <b>Not updated</b> means it may fail until the developer patches. Always download from the
        official site, use antivirus common sense, and never share account credentials.
      </div>

      <ExecutorsClient />
    </main>
  );
}
