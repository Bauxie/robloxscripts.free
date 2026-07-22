import type { MetadataRoute } from "next";
import { listScripts } from "@/lib/store";
import { getAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const SITE = "https://robloxscripts.free";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE}/scripts`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE}/executors`, changeFrequency: "weekly", priority: 0.6 },
  ];

  try {
    const scripts = await listScripts({ sort: "new" });
    const scriptEntries = scripts.slice(0, 5000).map((s) => ({
      url: `${SITE}/script/${s.id}`,
      lastModified: new Date(s.createdAt),
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));

    const { data: profiles } = await getAdminClient()
      .from("profiles")
      .select("username, created_at")
      .limit(2000);

    const profileEntries = (profiles || []).map((p) => ({
      url: `${SITE}/u/${encodeURIComponent(p.username as string)}`,
      lastModified: p.created_at ? new Date(p.created_at as string) : undefined,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }));

    return [...staticRoutes, ...scriptEntries, ...profileEntries];
  } catch {
    return staticRoutes;
  }
}
