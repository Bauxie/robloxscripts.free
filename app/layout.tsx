import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import ToastProvider from "@/components/ToastProvider";

export const metadata: Metadata = {
  title: "robloxscripts.free — Upload & Share Roblox Scripts",
  description: "A cartoony beach home for uploading and sharing free Roblox scripts.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌊</text></svg>",
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
      </head>
      <body>
        <ToastProvider>
          <Nav />
          {children}
          <footer className="footer">
            <span>🌊 robloxscripts.free</span>
            <span className="muted">
              Made for the Roblox scripting community · Be kind, share responsibly.
            </span>
          </footer>
        </ToastProvider>
      </body>
    </html>
  );
}
