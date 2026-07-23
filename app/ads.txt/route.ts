import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Google AdSense ads.txt
 * Defaults to the site publisher ID; override with NEXT_PUBLIC_ADSENSE_CLIENT or ADSENSE_PUB_ID.
 */
export async function GET() {
  const client = (process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-9808155078584354").trim();
  const pub =
    (process.env.ADSENSE_PUB_ID || "").trim() ||
    (client.startsWith("ca-pub-") ? client.slice(3) : client.startsWith("pub-") ? client : "");

  const lines = [
    "# robloxscripts.free ads.txt",
    `google.com, ${pub || "pub-9808155078584354"}, DIRECT, f08c47fec0942fa0`,
  ];

  return new NextResponse(lines.join("\n") + "\n", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
