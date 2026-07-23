import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import ToastProvider from "@/components/ToastProvider";
import AdSenseLoader from "@/components/AdSenseLoader";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import CookieConsent from "@/components/CookieConsent";
import Link from "next/link";

export const metadata: Metadata = {
  metadataBase: new URL("https://robloxscripts.free"),
  title: {
    default: "robloxscripts.free — Upload & Share Roblox Scripts",
    template: "%s · robloxscripts.free",
  },
  description:
    "Free Roblox scripts you can copy, download, and share. Browse by game and tags, then run them in your executor.",
  keywords: [
    "roblox scripts",
    "free roblox scripts",
    "roblox lua",
    "script hub",
    "robloxscripts.free",
  ],
  applicationName: "robloxscripts.free",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    siteName: "robloxscripts.free",
    title: "robloxscripts.free — Upload & Share Roblox Scripts",
    description:
      "Free Roblox scripts you can copy, download, and share. Browse by game and tags.",
    url: "https://robloxscripts.free",
  },
  twitter: {
    card: "summary",
    title: "robloxscripts.free — Upload & Share Roblox Scripts",
    description: "Free Roblox scripts you can copy, download, and share.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <AdSenseLoader />
      </head>
      <body>
        <GoogleAnalytics />
        <ToastProvider>
          <Nav />
          {children}
          <footer className="footer">
            <span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt=""
                width={22}
                height={22}
                style={{
                  verticalAlign: "middle",
                  marginRight: 8,
                  borderRadius: 6,
                  border: "2px solid var(--line)",
                }}
              />
              robloxscripts.free
            </span>
            <nav className="footer-links">
              <Link href="/about">About</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/dmca">DMCA</Link>
              <a
                href="https://discord.gg/TaX9wg9seD"
                target="_blank"
                rel="noopener noreferrer"
              >
                Discord
              </a>
            </nav>
            <span className="muted">
              Not affiliated with Roblox Corporation · Be kind, share responsibly.
            </span>
          </footer>
          <CookieConsent />
        </ToastProvider>
      </body>
    </html>
  );
}
