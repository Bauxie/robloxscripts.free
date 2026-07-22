export const esc = (s = "") =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

export function timeAgo(iso: string): string {
  const d = new Date(iso);
  const secs = Math.floor((Date.now() - d.getTime()) / 1000);
  const units: [string, number][] = [
    ["y", 31536000],
    ["mo", 2592000],
    ["d", 86400],
    ["h", 3600],
    ["m", 60],
  ];
  for (const [label, s] of units) {
    const v = Math.floor(secs / s);
    if (v >= 1) return `${v}${label} ago`;
  }
  return "just now";
}

export function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1048576).toFixed(1)} MB`;
}

// Naive Lua syntax highlighter -> returns HTML string
export function highlightLua(code: string): string {
  const kw =
    /\b(local|function|end|if|then|else|elseif|for|in|do|while|repeat|until|return|and|or|not|nil|true|false|break|continue)\b/g;
  const b64 = (s: string) => btoa(unescape(encodeURIComponent(s)));
  const unb64 = (s: string) => decodeURIComponent(escape(atob(s)));

  let out = esc(code);
  out = out.replace(/(--\[\[[\s\S]*?\]\]|--[^\n]*)/g, (m) => `\u0000C${b64(m)}\u0000`);
  out = out.replace(/("[^"\n]*"|'[^'\n]*')/g, (m) => `\u0000S${b64(m)}\u0000`);
  out = out.replace(kw, '<span class="kw">$1</span>');
  out = out.replace(/\b(\d+\.?\d*)\b/g, '<span class="num">$1</span>');
  out = out.replace(/([a-zA-Z_]\w*)(\s*\()/g, '<span class="fn">$1</span>$2');
  out = out.replace(/\u0000C([A-Za-z0-9+/=]+)\u0000/g, (_, x) => `<span class="com">${esc(unb64(x))}</span>`);
  out = out.replace(/\u0000S([A-Za-z0-9+/=]+)\u0000/g, (_, x) => `<span class="str">${esc(unb64(x))}</span>`);
  return out;
}
