import type { Metadata } from "next";
import Link from "next/link";
import LegalShell from "@/components/LegalShell";

export const metadata: Metadata = {
  title: "About",
  description:
    "About robloxscripts.free — a community hub for uploading, browsing, and sharing free Roblox scripts.",
};

export default function AboutPage() {
  return (
    <LegalShell
      eyebrow="Who we are"
      title="About robloxscripts.free"
      subtitle="A community library for free Roblox scripts — browse, copy, upload, and share."
    >
      <h2>What this site is</h2>
      <p>
        <strong>robloxscripts.free</strong> is an independent community site where creators can
        upload Lua scripts and players can browse, copy, and download them. We are not affiliated
        with, endorsed by, or sponsored by Roblox Corporation.
      </p>

      <h2>What you can do here</h2>
      <ul>
        <li>Browse and search scripts by game, tags, executors, and popularity</li>
        <li>Upload your own scripts when signed in</li>
        <li>Like, comment, and follow creators’ public profiles</li>
        <li>Report content that breaks our rules so staff can review it</li>
      </ul>

      <h2>Safety &amp; responsibility</h2>
      <p>
        Scripts are user-submitted. Always review code before running it. Never paste scripts you
        don’t trust, and never share account credentials. Use tools and scripts at your own risk and
        follow Roblox’s terms and local laws.
      </p>

      <h2>Contact</h2>
      <p>
        Questions, partnership, or takedown requests: reach us on{" "}
        <a href="https://discord.gg/TaX9wg9seD" target="_blank" rel="noopener noreferrer">
          Discord
        </a>{" "}
        or use the{" "}
        <Link href="/contact">contact page</Link>.
      </p>

      <h2>Policies</h2>
      <p>
        Please read our <Link href="/privacy">Privacy Policy</Link> and{" "}
        <Link href="/terms">Terms of Service</Link>.
      </p>
    </LegalShell>
  );
}
