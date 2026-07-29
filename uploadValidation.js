/**
 * uploadValidation.js
 * Single source of truth for upload rules. Import on the client for live
 * feedback and on the server for enforcement. Same function, both sides.
 *
 * Rules:
 *   description  >= 20 real characters, >= 4 distinct words, no filler spam
 *   tags         >= 1
 *   executors    >= 2, from the known list
 *   source       non-empty, >= 10 characters of actual code
 */

export const RULES = {
  DESCRIPTION_MIN: 20,
  DESCRIPTION_MAX: 600,
  DESCRIPTION_MIN_WORDS: 4,
  TAGS_MIN: 1,
  TAGS_MAX: 8,
  EXECUTORS_MIN: 2,
  SOURCE_MIN: 10,
  SOURCE_MAX: 500_000,
  TITLE_MIN: 3,
  TITLE_MAX: 80,
};

export const KNOWN_EXECUTORS = [
  'Cosmic', 'Delta', 'Codex', 'Arceus X', 'Solara', 'Swift', 'Wave', 'Xeno',
  'Fluxus', 'Krnl', 'Synapse Z', 'Volcano', 'Trigon', 'Ronin', 'Potassium',
  'Vega X', 'Argon', 'Seliware', 'AWP', 'Bunni', 'Zenith', 'MacSploit',
  'Hydrogen', 'Cryptic', 'Velocity', 'JJSploit',
];

const EXECUTOR_LOOKUP = new Map(KNOWN_EXECUTORS.map((e) => [e.toLowerCase(), e]));

/** Collapses whitespace and strips zero-width padding used to game length checks. */
function clean(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[​-‍﻿]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Rejects "aaaaaaaaaaaaaaaaaaaaa" and "asdf asdf asdf asdf" — strings that
 * clear a naive length check but carry zero information.
 */
function isFiller(text) {
  const lower = text.toLowerCase();
  const letters = lower.replace(/[^a-z0-9]/g, '');
  if (letters.length === 0) return true;

  const distinctChars = new Set(letters).size;
  if (distinctChars <= 4) return true;

  const words = lower.split(' ').filter(Boolean);
  const distinctWords = new Set(words).size;
  if (words.length >= 4 && distinctWords <= 2) return true;

  if (/^(.)\1{9,}$/.test(letters)) return true;
  if (/^(?:test|asdf|qwerty|lorem ipsum|idk|none|n\/a|no description)\b/i.test(text)) return true;

  return false;
}

/** Normalizes an executor name against the known list. Returns null if unrecognized. */
export function normalizeExecutor(name) {
  if (typeof name !== 'string') return null;
  return EXECUTOR_LOOKUP.get(name.trim().toLowerCase()) ?? null;
}

export function validateTitle(raw) {
  const title = clean(raw);
  if (!title) return 'Give your script a title.';
  if (title.length < RULES.TITLE_MIN) return `Title needs at least ${RULES.TITLE_MIN} characters.`;
  if (title.length > RULES.TITLE_MAX) return `Title is capped at ${RULES.TITLE_MAX} characters.`;
  return null;
}

export function validateDescription(raw) {
  const text = clean(raw);
  if (!text) return `Write a description — at least ${RULES.DESCRIPTION_MIN} characters.`;
  if (text.length < RULES.DESCRIPTION_MIN) {
    const short = RULES.DESCRIPTION_MIN - text.length;
    return `${short} more character${short === 1 ? '' : 's'} needed.`;
  }
  if (text.length > RULES.DESCRIPTION_MAX) return `Description is capped at ${RULES.DESCRIPTION_MAX} characters.`;

  const wordCount = text.split(' ').filter((w) => w.length > 1).length;
  if (wordCount < RULES.DESCRIPTION_MIN_WORDS) {
    return `Use at least ${RULES.DESCRIPTION_MIN_WORDS} words — say what the script actually does.`;
  }
  if (isFiller(text)) return 'Write a real description. Placeholder text gets rejected.';
  return null;
}

export function validateTags(raw) {
  const tags = Array.isArray(raw) ? raw.map(clean).filter(Boolean) : [];
  const unique = [...new Set(tags.map((t) => t.toLowerCase()))];
  if (unique.length < RULES.TAGS_MIN) return `Pick at least ${RULES.TAGS_MIN} tag.`;
  if (unique.length > RULES.TAGS_MAX) return `Maximum ${RULES.TAGS_MAX} tags.`;
  return null;
}

export function validateExecutors(raw) {
  const list = Array.isArray(raw) ? raw : [];
  const normalized = [...new Set(list.map(normalizeExecutor).filter(Boolean))];
  if (normalized.length < RULES.EXECUTORS_MIN) {
    const missing = RULES.EXECUTORS_MIN - normalized.length;
    return `Select ${missing} more executor${missing === 1 ? '' : 's'} — minimum ${RULES.EXECUTORS_MIN}.`;
  }
  return null;
}

export function validateSource(raw) {
  const source = typeof raw === 'string' ? raw.trim() : '';
  if (!source) return 'Paste the script. This field cannot be empty.';
  if (source.length < RULES.SOURCE_MIN) return `Script looks too short — at least ${RULES.SOURCE_MIN} characters.`;
  if (source.length > RULES.SOURCE_MAX) return 'Script exceeds the 500 KB limit.';

  const meaningful = source
    .replace(/--\[\[[\s\S]*?\]\]/g, '')
    .replace(/--[^\n]*/g, '')
    .trim();
  if (!meaningful) return 'Script is all comments. Paste the actual code.';
  return null;
}

/**
 * Runs every rule. Returns { valid, errors, cleaned }.
 * `cleaned` is the normalized payload — write this to the DB, not the raw input.
 */
export function validateUpload(payload = {}) {
  const errors = {
    title: validateTitle(payload.title),
    description: validateDescription(payload.description),
    tags: validateTags(payload.tags),
    executors: validateExecutors(payload.executors),
    source: validateSource(payload.source),
  };

  for (const key of Object.keys(errors)) {
    if (errors[key] === null) delete errors[key];
  }

  const cleaned = {
    title: clean(payload.title),
    description: clean(payload.description),
    tags: [...new Set((payload.tags || []).map(clean).filter(Boolean))],
    executors: [...new Set((payload.executors || []).map(normalizeExecutor).filter(Boolean))],
    source: typeof payload.source === 'string' ? payload.source.trim() : '',
    gameName: clean(payload.gameName) || null,
    keySystem: Boolean(payload.keySystem),
  };

  return { valid: Object.keys(errors).length === 0, errors, cleaned };
}

/**
 * Standing help text — shown under every field before the user makes a mistake.
 * Prevention beats correction. These never change; they state the rule.
 */
export const FIELD_HELP = {
  title: 'Name the game and what the script does. 3–80 characters.',
  gameName: 'Optional. Leave blank if the script works across games.',
  description: `At least ${RULES.DESCRIPTION_MIN} characters and ${RULES.DESCRIPTION_MIN_WORDS} words. Say what it does, not that it works.`,
  tags: `Pick at least ${RULES.TAGS_MIN} tag so people can find it.`,
  executors: `Select the ${RULES.EXECUTORS_MIN}+ executors you actually tested on.`,
  source: 'Paste the full script or the loader line. Comments alone are rejected.',
};

/** Human labels for the error summary banner. */
export const FIELD_LABELS = {
  title: 'Title',
  description: 'Description',
  tags: 'Tags',
  executors: 'Tested executors',
  source: 'Script',
};

/** Render order — the summary lists failures top-to-bottom as they appear in the form. */
export const FIELD_ORDER = ['title', 'description', 'tags', 'executors', 'source'];

/**
 * Turns the errors object into an ordered list for the summary banner.
 * Returns [{ field, label, message }] in form order, not object-key order.
 */
export function summarizeErrors(errors = {}) {
  return FIELD_ORDER.filter((field) => errors[field]).map((field) => ({
    field,
    label: FIELD_LABELS[field],
    message: errors[field],
  }));
}

/** The first field that failed, in form order. This is what gets focus. */
export function firstInvalidField(errors = {}) {
  return FIELD_ORDER.find((field) => errors[field]) ?? null;
}

/** Live counter state for the description field — drives the UI hint. */
export function descriptionProgress(raw) {
  const length = clean(raw).length;
  return {
    length,
    min: RULES.DESCRIPTION_MIN,
    max: RULES.DESCRIPTION_MAX,
    remaining: Math.max(0, RULES.DESCRIPTION_MIN - length),
    met: length >= RULES.DESCRIPTION_MIN,
    over: length > RULES.DESCRIPTION_MAX,
  };
}

/** Same countdown shape for the script paste box. */
export function sourceProgress(raw) {
  const length = typeof raw === 'string' ? raw.trim().length : 0;
  return {
    length,
    min: RULES.SOURCE_MIN,
    remaining: Math.max(0, RULES.SOURCE_MIN - length),
    met: length >= RULES.SOURCE_MIN,
    over: length > RULES.SOURCE_MAX,
  };
}

/** Countdown for any multi-select field. Drives the tag and executor hints. */
export function selectionProgress(list, min) {
  const count = Array.isArray(list) ? new Set(list.filter(Boolean)).size : 0;
  return {
    count,
    min,
    remaining: Math.max(0, min - count),
    met: count >= min,
  };
}
