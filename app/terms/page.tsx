import type { Metadata } from "next";
import Link from "next/link";
import LegalShell from "@/components/LegalShell";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service for robloxscripts.free — rules for using the site, uploading scripts, and content standards.",
};

export default function TermsPage() {
  const updated = "July 22, 2026";

  return (
    <LegalShell
      eyebrow="The rules"
      title="Terms of Service"
      subtitle={`Last updated: ${updated}. By using robloxscripts.free you agree to these terms.`}
    >
      <h2>1. Acceptance</h2>
      <p>
        By accessing or using <strong>robloxscripts.free</strong> (the “Site”), you agree to these
        Terms and our <Link href="/privacy">Privacy Policy</Link>. If you do not agree, do not use
        the Site.
      </p>

      <h2>2. Not affiliated with Roblox</h2>
      <p>
        The Site is an independent fan / community project. It is not affiliated with Roblox
        Corporation. “Roblox” is a trademark of its respective owner.
      </p>

      <h2>3. Accounts</h2>
      <ul>
        <li>You must provide accurate information and keep your login secure</li>
        <li>You are responsible for activity under your account</li>
        <li>We may suspend or ban accounts that break these Terms</li>
      </ul>

      <h2>4. User content</h2>
      <p>
        You retain rights to scripts and other content you upload. By posting, you grant us a
        non-exclusive license to host, display, copy, and distribute that content on the Site so
        others can browse, copy, and download it as the Site features allow.
      </p>
      <p>You must not upload content that:</p>
      <ul>
        <li>Contains malware, stealers, token loggers, or phishing</li>
        <li>Infringes copyrights, trademarks, or other rights</li>
        <li>Harasses, threatens, or doxses people</li>
        <li>Is illegal, or promotes illegal activity</li>
        <li>Is spam, scams, or misleading downloads</li>
        <li>Exposes private keys, passwords, or personal data of others</li>
      </ul>

      <h2>5. Scripts &amp; risk</h2>
      <p>
        Scripts are provided by users “as is.” Running third-party code can harm your device or
        accounts. You use everything on the Site at your own risk. We do not guarantee that any
        script is safe, working, or allowed by Roblox or your executor.
      </p>

      <h2>6. Moderation</h2>
      <p>
        We may remove content, limit features, or ban users at our discretion, including after
        reports. Staff actions may notify affected users when appropriate.
      </p>

      <h2>7. Intellectual property claims</h2>
      <p>
        If you believe content on the Site infringes your rights, contact us via{" "}
        <Link href="/contact">/contact</Link> with the URL, description, and proof of ownership. We
        will review good-faith notices.
      </p>

      <h2>8. Advertising</h2>
      <p>
        The Site may display third-party ads (including Google AdSense). Ads are not endorsements.
        Your use of ads is also subject to those providers’ policies.
      </p>

      <h2>9. Disclaimers</h2>
      <p>
        THE SITE IS PROVIDED “AS IS” WITHOUT WARRANTIES OF ANY KIND. TO THE MAXIMUM EXTENT PERMITTED
        BY LAW, WE ARE NOT LIABLE FOR DAMAGES ARISING FROM USE OF THE SITE OR USER CONTENT.
      </p>

      <h2>10. Changes</h2>
      <p>
        We may update these Terms. Continued use after changes means you accept the new Terms.
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions: <Link href="/contact">Contact</Link> ·{" "}
        <a href="https://discord.gg/TaX9wg9seD" target="_blank" rel="noopener noreferrer">
          Discord
        </a>
        .
      </p>
    </LegalShell>
  );
}
