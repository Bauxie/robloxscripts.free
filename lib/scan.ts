/** Heuristic scan for stealers / webhooks in uploaded Lua */

const PATTERNS: { id: string; label: string; re: RegExp }[] = [
  {
    id: "discord_webhook",
    label: "Discord webhook URL (possible stealer)",
    re: /discord(?:app)?\.com\/api\/webhooks\/\d+/i,
  },
  {
    id: "webhook_generic",
    label: "Generic webhook endpoint",
    re: /https?:\/\/[^\s\"']*webhook[^\s\"']*/i,
  },
  {
    id: "http_request",
    label: "Outbound HTTP request (review carefully)",
    re: /\b(?:HttpService|request|syn\.request|http\.request|fluxus\.request)\b/i,
  },
  {
    id: "token_cookie",
    label: "Possible cookie/token harvesting",
    re: /\b(?:cookie|robloxsecurity|\.ROBLOSECURITY|accountcookie)\b/i,
  },
  {
    id: "loadstring_remote",
    label: "Remote loadstring / getfenv obfuscation",
    re: /loadstring\s*\(\s*(?:game:HttpGet|http)/i,
  },
];

export function scanScriptCode(code: string): { id: string; label: string }[] {
  const text = String(code || "");
  const hits: { id: string; label: string }[] = [];
  for (const p of PATTERNS) {
    if (p.re.test(text)) hits.push({ id: p.id, label: p.label });
  }
  return hits;
}
