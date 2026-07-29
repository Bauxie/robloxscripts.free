/**
 * cardFallbacks.js
 * Derives real content for script cards when the uploader leaves fields blank.
 * Framework-agnostic. Pure functions, no DOM, no deps.
 */

const FEATURE_SIGNATURES = [
  [/\besp\b|highlight|BillboardGui|Drawing\.new/i, 'ESP'],
  [/aim\s*bot|aimlock|mousemoverel|CFrame\.lookAt/i, 'Aim Assist'],
  [/auto\s*farm|autofarm|farmloop/i, 'Auto Farm'],
  [/coin|cash|money|currency/i, 'Coin Collect'],
  [/teleport|CFrame\s*=\s*CFrame\.new|MoveTo/i, 'Teleport'],
  [/WalkSpeed|JumpPower|JumpHeight/i, 'Speed / Jump'],
  [/Fly|BodyVelocity|LinearVelocity/i, 'Fly'],
  [/notif|Notification|SendNotification/i, 'Notifications'],
  [/Rayfield|OrionLib|Fluent|Kavo|LinoriaLib/i, 'GUI Library'],
  [/Kill|Damage|Humanoid\.Health\s*=\s*0/i, 'Combat'],
  [/loadstring\s*\(/i, 'Loader'],
];

const LIB_SIGNATURES = [
  [/Rayfield/i, 'Rayfield'],
  [/OrionLib/i, 'Orion'],
  [/Fluent/i, 'Fluent'],
  [/LinoriaLib|Linoria/i, 'Linoria'],
  [/Kavo/i, 'Kavo'],
];

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/** Strips comments and blank lines so metrics reflect actual code. */
function stripNoise(source) {
  return source
    .replace(/--\[\[[\s\S]*?\]\]/g, '')
    .replace(/--[^\n]*/g, '')
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .join('\n');
}

/** Reads the source and returns detected feature labels, deduped, max 4. */
export function detectFeatures(source, limit = 4) {
  if (typeof source !== 'string' || !source.trim()) return [];
  const code = stripNoise(source);
  const hits = [];
  for (const [pattern, label] of FEATURE_SIGNATURES) {
    if (pattern.test(code) && !hits.includes(label)) hits.push(label);
    if (hits.length >= limit) break;
  }
  return hits;
}

/** Returns the GUI library name if one is detected, otherwise null. */
export function detectLibrary(source) {
  if (typeof source !== 'string') return null;
  for (const [pattern, name] of LIB_SIGNATURES) {
    if (pattern.test(source)) return name;
  }
  return null;
}

/** Real numbers for the metric row — lines, size, loader vs. full source. */
export function sourceMetrics(source) {
  if (typeof source !== 'string' || !source.trim()) return null;
  const code = stripNoise(source);
  const lineCount = code.split('\n').length;
  const byteSize = new TextEncoder().encode(source).length;
  return {
    lineCount,
    byteSize,
    sizeLabel: byteSize < 1024 ? `${byteSize} B` : `${(byteSize / 1024).toFixed(1)} KB`,
    isLoader: lineCount <= 3 && /loadstring\s*\(/i.test(code),
  };
}

/**
 * Builds a description when the uploader left it blank.
 * Never returns "No description provided" — it returns a sentence
 * assembled from metadata that already exists on the record.
 */
export function deriveDescription(post) {
  const { description, gameName, tags = [], author, source, createdAt } = post;

  const trimmed = typeof description === 'string' ? description.trim() : '';
  if (trimmed.length >= 12) return { text: trimmed, derived: false };

  const features = detectFeatures(source);
  const library = detectLibrary(source);
  const metrics = sourceMetrics(source);
  const executors = tags.filter((t) => /cosmic|delta|codex|arceus|solara|swift|wave|xeno|fluxus/i.test(t));

  const parts = [];

  if (features.length) {
    parts.push(`${listify(features)} for ${gameName || 'Roblox'}`);
  } else if (metrics?.isLoader) {
    parts.push(`One-line loader for ${gameName || 'Roblox'}`);
  } else {
    parts.push(`${gameName || 'Roblox'} script`);
  }

  if (library) parts.push(`built on the ${library} UI`);
  if (executors.length) parts.push(`tested on ${listify(executors)}`);
  if (metrics && !metrics.isLoader) parts.push(`${metrics.lineCount} lines`);
  if (author) parts.push(`uploaded by @${author.replace(/^@/, '')}`);

  const text = capitalize(parts.join(' · ')) + '.';
  return { text, derived: true, features, library, metrics, freshAt: createdAt };
}

/**
 * Collapses the stat row. Zero-value stats are dropped instead of
 * rendered as "0 likes" — an empty stat reads worse than a missing one.
 * Always returns at least one chip so the row never disappears.
 */
export function visibleStats({ views = 0, likes = 0, copies = 0, createdAt }) {
  const chips = [];
  if (views > 0) chips.push({ key: 'views', icon: '👁', label: plural(views, 'view') });
  if (likes > 0) chips.push({ key: 'likes', icon: '❤️', label: plural(likes, 'like') });
  if (copies > 0) chips.push({ key: 'copies', icon: '📋', label: plural(copies, 'copy', 'copies') });

  if (chips.length === 0) {
    chips.push({ key: 'new', icon: '✨', label: freshLabel(createdAt) });
  }
  return chips;
}

/** "Just posted" / "New today" instead of a row of zeroes. */
function freshLabel(createdAt) {
  if (!createdAt) return 'Just posted';
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const minutes = Math.floor(ageMs / 60000);
  if (minutes < 60) return 'Just posted';
  if (minutes < 1440) return 'New today';
  const days = Math.floor(minutes / 1440);
  return `Added ${days}d ago`;
}

/** Deterministic gradient seeded off the title — no two cards look identical. */
export function thumbnailFallback(seedText = '') {
  let hash = 0;
  for (let i = 0; i < seedText.length; i++) {
    hash = (hash * 31 + seedText.charCodeAt(i)) >>> 0;
  }
  const hue = hash % 360;
  const hue2 = (hue + 48) % 360;
  const initials = seedText
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
  return {
    background: `linear-gradient(135deg, hsl(${hue} 68% 42%), hsl(${hue2} 72% 26%))`,
    initials: initials || 'RB',
  };
}

/** Single entry point — feed it a raw post row, get a render-ready object. */
export function normalizePost(post) {
  const { text, derived, features, library, metrics } = deriveDescription(post);
  const title = (post.title || '').trim() || `${post.gameName || 'Untitled'} Script`;

  return {
    ...post,
    title,
    description: text,
    descriptionIsDerived: derived,
    features: features?.length ? features : detectFeatures(post.source),
    library: library ?? detectLibrary(post.source),
    metrics: metrics ?? sourceMetrics(post.source),
    stats: visibleStats(post),
    thumbnail: post.thumbnailUrl || thumbnailFallback(title),
    codePreview: buildCodePreview(post.source),
  };
}

/** First three meaningful lines, truncated. Fills the gap a blank description leaves. */
export function buildCodePreview(source, maxLines = 3, maxChars = 72) {
  if (typeof source !== 'string' || !source.trim()) return null;
  return stripNoise(source)
    .split('\n')
    .slice(0, maxLines)
    .map((line) => {
      const t = line.trim();
      return t.length > maxChars ? `${t.slice(0, maxChars - 1)}…` : t;
    });
}

function listify(items) {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function plural(n, one, many) {
  const word = n === 1 ? one : many || `${one}s`;
  return `${n.toLocaleString()} ${word}`;
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const __internals = { stripNoise, freshLabel, listify, clamp };
