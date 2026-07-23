import { NextResponse } from "next/server";
import { listScripts } from "@/lib/store";
import { getAdminClient } from "@/lib/supabase/admin";
import { slugifyGame } from "@/lib/games";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE = "https://robloxscripts.free";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry(
  loc: string,
  opts?: { lastmod?: string; changefreq?: string; priority?: string }
) {
  return [
    "<url>",
    `<loc>${escapeXml(loc)}</loc>`,
    opts?.lastmod ? `<lastmod>${opts.lastmod}</lastmod>` : "",
    opts?.changefreq ? `<changefreq>${opts.changefreq}</changefreq>` : "",
    opts?.priority ? `<priority>${opts.priority}</priority>` : "",
    "</url>",
  ]
    .filter(Boolean)
    .join("");
}

export async function GET() {
  const urls: string[] = [
    urlEntry(SITE, { changefreq: "hourly", priority: "1.0" }),
    urlEntry(`${SITE}/scripts`, { changefreq: "hourly", priority: "0.9" }),
    urlEntry(`${SITE}/executors`, { changefreq: "weekly", priority: "0.6" }),
    urlEntry(`${SITE}/about`, { changefreq: "monthly", priority: "0.4" }),
    urlEntry(`${SITE}/contact`, { changefreq: "monthly", priority: "0.4" }),
    urlEntry(`${SITE}/privacy`, { changefreq: "monthly", priority: "0.3" }),
    urlEntry(`${SITE}/terms`, { changefreq: "monthly", priority: "0.3" }),
    urlEntry(`${SITE}/dmca`, { changefreq: "monthly", priority: "0.3" }),
  ];

  try {
    const scripts = await listScripts({ sort: "new" });
    const games = new Set<string>();

    for (const s of scripts.slice(0, 5000)) {
      urls.push(
        urlEntry(`${SITE}/script/${s.id}`, {
          lastmod: new Date(s.updatedAt || s.createdAt).toISOString(),
          changefreq: "daily",
          priority: "0.8",
        })
      );
      const slug = slugifyGame(s.game);
      if (slug) games.add(slug);
    }

    for (const slug of games) {
      urls.push(
        urlEntry(`${SITE}/game/${encodeURIComponent(slug)}`, {
          changefreq: "daily",
          priority: "0.75",
        })
      );
    }

    const { data: profiles } = await getAdminClient()
      .from("profiles")
      .select("username, created_at")
      .limit(2000);

    for (const p of profiles || []) {
      urls.push(
        urlEntry(`${SITE}/u/${encodeURIComponent(p.username as string)}`, {
          lastmod: p.created_at
            ? new Date(p.created_at as string).toISOString()
            : undefined,
          changefreq: "weekly",
          priority: "0.5",
        })
      );
    }
  } catch {
    // Keep static URLs if DB is unavailable
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
