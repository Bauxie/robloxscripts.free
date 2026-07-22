import { Suspense } from "react";
import type { Metadata } from "next";
import ScriptsClient from "@/components/ScriptsClient";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

type PageProps = {
  searchParams?: { q?: string; sort?: string };
};

export function generateMetadata({ searchParams }: PageProps): Metadata {
  const q = (searchParams?.q || "").trim();
  if (!q) {
    return {
      title: "Scripts",
      description: "Browse and search free Roblox scripts shared by the community.",
      keywords: ["roblox scripts", "free scripts", "lua scripts", "script hub"],
    };
  }

  const label = q.startsWith("#") ? q.slice(1) : q;
  const title = `${label} Roblox scripts`;
  const description = `Free Roblox scripts tagged or matching “${label}” on ${SITE_NAME}. Copy, download, and share.`;

  return {
    title,
    description,
    keywords: [label, `${label} script`, `${label} roblox`, "roblox script", "free roblox script"],
    alternates: {
      canonical: `${SITE_URL}/scripts?q=${encodeURIComponent(q)}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/scripts?q=${encodeURIComponent(q)}`,
      siteName: SITE_NAME,
      type: "website",
    },
  };
}

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
