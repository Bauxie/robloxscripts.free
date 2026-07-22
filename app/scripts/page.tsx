import { Suspense } from "react";
import ScriptsClient from "@/components/ScriptsClient";

export const metadata = {
  title: "Scripts — robloxscripts.free",
  description: "Browse and search free Roblox scripts shared by the community.",
};

export default function ScriptsPage() {
  return (
    <Suspense
      fallback={
        <main className="app">
          <div className="loading">
            <div className="spinner" />
            Loading…
          </div>
        </main>
      }
    >
      <ScriptsClient />
    </Suspense>
  );
}
