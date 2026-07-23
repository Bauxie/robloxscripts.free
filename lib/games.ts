/** Slug helpers for /game/[slug] pages */

export function slugifyGame(name: string): string {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function gameHref(name: string): string {
  const slug = slugifyGame(name);
  return slug ? `/game/${encodeURIComponent(slug)}` : "/scripts";
}

/** Match a stored game name to a URL slug (case/spacing insensitive). */
export function gameMatchesSlug(gameName: string, slug: string): boolean {
  return slugifyGame(gameName) === slugifyGame(slug);
}
