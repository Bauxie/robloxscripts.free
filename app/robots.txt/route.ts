import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const body = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/
Disallow: /login
Disallow: /signup
Disallow: /upload
Disallow: /notifications

Sitemap: https://robloxscripts.free/sitemap.xml
`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
