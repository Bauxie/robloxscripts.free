/** Safe same-origin path for post-login redirects. */
export function safeNextPath(raw: string | null | undefined, fallback = "/profile"): string {
  if (!raw) return fallback;
  let next = String(raw).trim();
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return fallback;
  }
  // Block protocol-relative and scheme smuggling
  if (/^\/[\\/]/.test(next) || next.toLowerCase().includes("://")) {
    return fallback;
  }
  // Keep relative app paths only
  if (next.length > 200) return fallback;
  return next;
}

/** Never trust X-Forwarded-Host for redirects. */
export function safeRequestOrigin(requestUrl: string): string {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL || "https://robloxscripts.free")
    .trim()
    .replace(/\/$/, "");
  if (process.env.NODE_ENV === "development") {
    try {
      return new URL(requestUrl).origin;
    } catch {
      return configured;
    }
  }
  return configured || "https://robloxscripts.free";
}
