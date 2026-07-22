import type { Metadata } from "next";
import Link from "next/link";
import LegalShell from "@/components/LegalShell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for robloxscripts.free — how we collect, use, and protect your information, including cookies and advertising.",
};

export default function PrivacyPage() {
  const updated = "July 22, 2026";

  return (
    <LegalShell
      eyebrow="Your data"
      title="Privacy Policy"
      subtitle={`Last updated: ${updated}. This explains what we collect and how we use it.`}
    >
      <h2>1. Who we are</h2>
      <p>
        This Privacy Policy applies to <strong>robloxscripts.free</strong> (the “Site”). If you have
        questions, see our <Link href="/contact">Contact</Link> page.
      </p>

      <h2>2. Information we collect</h2>
      <ul>
        <li>
          <strong>Account data</strong> — email, username, avatar, bio, and auth provider info (for
          example Discord) when you sign up or log in via Supabase Auth.
        </li>
        <li>
          <strong>Content you submit</strong> — scripts, comments, reports, likes, and profile
          details you choose to publish.
        </li>
        <li>
          <strong>Usage data</strong> — pages viewed, script views/copies/likes, approximate device
          and browser info, and similar analytics needed to run the Site.
        </li>
        <li>
          <strong>Cookies &amp; local storage</strong> — session cookies for login, preferences (for
          example cookie consent), and similar technologies.
        </li>
      </ul>

      <h2>3. How we use information</h2>
      <ul>
        <li>Provide accounts, uploads, comments, notifications, and moderation tools</li>
        <li>Keep the Site secure and prevent abuse</li>
        <li>Improve features and content discovery</li>
        <li>Comply with law and respond to valid requests</li>
        <li>Show advertising (if enabled) via partners such as Google AdSense</li>
      </ul>

      <h2>4. Advertising &amp; Google AdSense</h2>
      <p>
        We may use <strong>Google AdSense</strong> and related Google advertising services to display
        ads. Google and its partners may use cookies or similar technologies to serve ads based on
        your prior visits to this Site or other websites.
      </p>
      <ul>
        <li>
          Google’s use of advertising cookies enables it and its partners to serve ads based on your
          visit to this Site and/or other sites on the Internet.
        </li>
        <li>
          You can opt out of personalized advertising by visiting{" "}
          <a
            href="https://www.google.com/settings/ads"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Ads Settings
          </a>
          .
        </li>
        <li>
          You can also visit{" "}
          <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer">
            aboutads.info
          </a>{" "}
          to opt out of some third-party vendors’ use of cookies for personalized advertising.
        </li>
        <li>
          Learn more in{" "}
          <a
            href="https://policies.google.com/technologies/ads"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google’s Advertising Technologies
          </a>{" "}
          and{" "}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
            Google Privacy Policy
          </a>
          .
        </li>
      </ul>

      <h2>5. Sharing of information</h2>
      <p>We share data only as needed to operate the Site, including:</p>
      <ul>
        <li>
          <strong>Supabase</strong> — authentication and database hosting
        </li>
        <li>
          <strong>Vercel</strong> — website hosting
        </li>
        <li>
          <strong>Google</strong> — advertising / analytics if AdSense or similar products are
          enabled
        </li>
        <li>Staff moderators reviewing reports and abuse</li>
        <li>Law enforcement or rights holders when legally required</li>
      </ul>
      <p>We do not sell your personal information.</p>

      <h2>6. Public content</h2>
      <p>
        Scripts, usernames, avatars, bios, comments, and similar posts are public by design. Do not
        publish secrets, personal data about others, or private keys.
      </p>

      <h2>7. Data retention</h2>
      <p>
        We keep account and content data while your account is active and as needed for security,
        backups, and legal obligations. You may request account deletion via{" "}
        <Link href="/contact">Contact</Link>.
      </p>

      <h2>8. Children’s privacy</h2>
      <p>
        The Site is not directed to children under 13 (or the digital consent age in your country).
        If you believe a child provided personal data, contact us and we will take appropriate
        steps.
      </p>

      <h2>9. Your choices</h2>
      <ul>
        <li>Update profile settings while logged in</li>
        <li>Clear cookies / local storage in your browser</li>
        <li>Opt out of personalized ads via the links in section 4</li>
        <li>Contact us for access or deletion requests where applicable</li>
      </ul>

      <h2>10. Changes</h2>
      <p>
        We may update this policy from time to time. The “Last updated” date at the top will change
        when we do. Continued use of the Site means you accept the updated policy.
      </p>

      <h2>11. Contact</h2>
      <p>
        Privacy questions: <Link href="/contact">/contact</Link> or our{" "}
        <a href="https://discord.gg/TaX9wg9seD" target="_blank" rel="noopener noreferrer">
          Discord
        </a>
        .
      </p>
    </LegalShell>
  );
}
