/** Public profile URL: /@username */
export function profilePath(username: string): string {
  const u = String(username || "")
    .trim()
    .replace(/^@+/, "");
  if (!u) return "/scripts";
  return `/@${encodeURIComponent(u)}`;
}
