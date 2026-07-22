import type { Metadata } from "next";
import type { ScriptRecord } from "@/lib/store";

export const SITE_URL = "https://robloxscripts.free";
export const SITE_NAME = "robloxscripts.free";

/** Build keyword list Google / crawlers can read from <meta name="keywords"> and JSON-LD. */
export function scriptKeywords(script: Pick<ScriptRecord, "title" | "game" | "tags" | "author">): string[] {
  const base = [
    "roblox script",
    "free roblox script",
    "roblox lua",
    script.title,
    script.game,
    script.author ? `@${script.author}` : "",
    ...(script.tags || []),
  ];

  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of base) {
    const k = String(raw || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out.slice(0, 20);
}

export function scriptDescription(script: Pick<ScriptRecord, "title" | "description" | "game" | "tags">): string {
  const tags = (script.tags || []).filter(Boolean);
  const tagLine = tags.length ? ` Tags: ${tags.map((t) => `#${t}`).join(", ")}.` : "";
  const gameLine = script.game ? ` for ${script.game}` : "";
  const body = (script.description || "").trim();

  if (body) {
    const clipped = body.length > 140 ? `${body.slice(0, 137)}…` : body;
    return `${clipped}${gameLine ? ` · Roblox script${gameLine}.` : ""}${tagLine}`.slice(0, 320);
  }

  return `Free Roblox script${gameLine}: ${script.title}.${tagLine} Copy and run on robloxscripts.free.`.slice(
    0,
    320
  );
}

export function buildScriptMetadata(script: ScriptRecord): Metadata {
  const url = `${SITE_URL}/script/${script.id}`;
  const title = script.game
    ? `${script.title} — ${script.game} script`
    : `${script.title} — Roblox script`;
  const description = scriptDescription(script);
  const keywords = scriptKeywords(script);
  const tags = (script.tags || []).filter(Boolean);

  return {
    title: {
      absolute: `${title} · ${SITE_NAME}`,
    },
    description,
    keywords,
    authors: [{ name: script.author || "Anonymous" }],
    category: "Roblox Scripts",
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      siteName: SITE_NAME,
      locale: "en_US",
      tags: tags.length ? tags : undefined,
      publishedTime: script.createdAt,
      authors: script.author ? [script.author] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    other: {
      // Extra discovery signals some crawlers still read
      news_keywords: keywords.slice(0, 10).join(", "),
    },
  };
}

/** Schema.org SoftwareSourceCode — includes keywords for rich results / understanding. */
export function scriptJsonLd(
  script: ScriptRecord,
  opts?: { thumbnailUrl?: string | null; playUrl?: string | null }
) {
  const url = `${SITE_URL}/script/${script.id}`;
  const keywords = scriptKeywords(script);

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: script.title,
    description: scriptDescription(script),
    url,
    keywords: keywords.join(", "),
    programmingLanguage: "Lua",
    runtimePlatform: "Roblox",
    datePublished: script.createdAt,
    author: {
      "@type": "Person",
      name: script.author || "Anonymous",
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    isAccessibleForFree: true,
    ...(script.game
      ? {
          about: {
            "@type": "VideoGame",
            name: script.game,
            ...(opts?.playUrl ? { url: opts.playUrl } : {}),
          },
        }
      : {}),
    ...(tagsAbout(script.tags)),
    ...(opts?.thumbnailUrl
      ? { image: opts.thumbnailUrl, thumbnailUrl: opts.thumbnailUrl }
      : { image: `${SITE_URL}/logo.png` }),
    codeRepository: url,
  };
}

function tagsAbout(tags: string[] | null | undefined) {
  const list = (tags || []).filter(Boolean);
  if (!list.length) return {};
  return {
    genre: list,
    additionalProperty: list.map((tag) => ({
      "@type": "PropertyValue",
      name: "tag",
      value: tag,
    })),
  };
}
