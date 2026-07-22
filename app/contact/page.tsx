import type { Metadata } from "next";
import Link from "next/link";
import LegalShell from "@/components/LegalShell";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact the robloxscripts.free team for support, reports, and business inquiries.",
};

export default function ContactPage() {
  const email = (process.env.NEXT_PUBLIC_CONTACT_EMAIL || "").trim();

  return (
    <LegalShell
      eyebrow="Get in touch"
      title="Contact"
      subtitle="We read every serious message — abuse reports, copyright claims, and partnerships."
    >
      <h2>Discord (fastest)</h2>
      <p>
        Join our server and open a ticket or message staff:{" "}
        <a href="https://discord.gg/TaX9wg9seD" target="_blank" rel="noopener noreferrer">
          discord.gg/TaX9wg9seD
        </a>
      </p>

      {email ? (
        <>
          <h2>Email</h2>
          <p>
            <a href={`mailto:${email}`}>{email}</a>
          </p>
        </>
      ) : null}

      <h2>Report content on the site</h2>
      <p>
        Signed-in users can use the <strong>Report</strong> button on scripts and profiles. Staff
        review the mod queue in Admin.
      </p>

      <h2>Legal / copyright</h2>
      <p>
        For DMCA or rights issues, include the URL of the content, proof of ownership, and your
        contact details. See also our <Link href="/terms">Terms of Service</Link>.
      </p>

      <h2>Site info</h2>
      <ul>
        <li>
          Website:{" "}
          <a href="https://robloxscripts.free">https://robloxscripts.free</a>
        </li>
        <li>
          About: <Link href="/about">/about</Link>
        </li>
        <li>
          Privacy: <Link href="/privacy">/privacy</Link>
        </li>
      </ul>
    </LegalShell>
  );
}
