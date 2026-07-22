import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Google AdSense ads.txt
 * Set NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-XXXXXXXX (or ADSENSE_PUB_ID=pub-XXXXXXXX)
 */
export async function GET() {
  const client = (process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "").trim();
  const pub =
    (process.env.ADSENSE_PUB_ID || "").trim() ||
    (client.startsWith("ca-pub-") ? client.slice(3) : client.startsWith("pub-") ? client : "");

  const lines = [
    "# robloxscripts.free ads.txt",
    "# Replace with your real publisher ID after AdSense approval.",
  ];

  if (pub) {
    lines.push(`google.com, ${pub}, DIRECT, f08c47fec0942fa0`);
  } else {
    lines.push("# google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0");
  }

  return new NextResponse(lines.join("\n") + "\n", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
