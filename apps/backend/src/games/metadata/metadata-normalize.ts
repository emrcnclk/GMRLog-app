/**
 * Pure normalization helpers for catalog metadata (D3.25).
 * No I/O, no Nest, no Prisma — imported by providers, the merger and the applier.
 * docs/18_CATALOG/METADATA_PROVIDERS.md §3
 */

/** Edition/suffix noise that must not affect title matching. */
const EDITION_SUFFIXES = [
  'game of the year edition',
  'goty edition',
  'definitive edition',
  'complete edition',
  'ultimate edition',
  'deluxe edition',
  'enhanced edition',
  'special edition',
  'anniversary edition',
  'remastered',
  'remaster',
  'directors cut',
  'the final cut',
  'goty',
];

const ROMAN_NUMERALS: Record<string, string> = {
  i: '1',
  ii: '2',
  iii: '3',
  iv: '4',
  v: '5',
  vi: '6',
  vii: '7',
  viii: '8',
  ix: '9',
  x: '10',
};

/** Lowercase, de-accent, strip punctuation, collapse whitespace. */
export function foldTitle(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Canonical comparison form: folded, edition suffixes removed, roman numerals
 * converted so "Final Fantasy VII" and "Final Fantasy 7" converge.
 */
export function normalizeTitle(value: string): string {
  let folded = foldTitle(value);

  for (const suffix of EDITION_SUFFIXES) {
    if (folded.endsWith(` ${suffix}`)) {
      folded = folded.slice(0, folded.length - suffix.length - 1).trim();
    }
  }

  return folded
    .split(' ')
    .map((token) => ROMAN_NUMERALS[token] ?? token)
    .join(' ')
    .trim();
}

export function titleTokens(value: string): Set<string> {
  const normalized = normalizeTitle(value);
  if (normalized.length === 0) {
    return new Set();
  }
  return new Set(normalized.split(' ').filter((token) => token.length > 0));
}

/** Slug for reference entities (genres, tags, companies, series, franchises). */
export function slugifyRef(value: string): string {
  const slug = foldTitle(value).replace(/ /g, '-').slice(0, 120);
  return slug.length > 0 ? slug : 'unknown';
}

/** Strip HTML that Steam's `detailed_description` embeds. */
export function stripHtml(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Trim to a storage ceiling without cutting mid-word where avoidable. */
export function clampText(value: string | null, maxLength: number): string | null {
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  const cut = trimmed.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > maxLength * 0.8 ? cut.slice(0, lastSpace) : cut).trimEnd();
}

/** Provider ratings arrive on several scales; the catalog stores 0–100. */
export function normalizeRating(value: number | null | undefined, scaleMax: number): number | null {
  if (value == null || !Number.isFinite(value) || scaleMax <= 0) {
    return null;
  }
  const scaled = (value / scaleMax) * 100;
  if (scaled < 0) {
    return 0;
  }
  if (scaled > 100) {
    return 100;
  }
  return Math.round(scaled * 100) / 100;
}

/** Force https and absolute form on protocol-relative provider image URLs. */
export function absoluteImageUrl(url: string): string | null {
  const trimmed = url.trim();
  if (trimmed.length === 0) {
    return null;
  }
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }
  if (trimmed.startsWith('http://')) {
    return `https://${trimmed.slice('http://'.length)}`;
  }
  if (trimmed.startsWith('https://')) {
    return trimmed;
  }
  return null;
}

export function parseReleaseYear(date: Date | null): number | null {
  if (date === null || Number.isNaN(date.getTime())) {
    return null;
  }
  return date.getUTCFullYear();
}

/** De-duplicate reference lists on slug, preserving first-seen order. */
export function dedupeBySlug<T extends { slug: string }>(refs: readonly T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const ref of refs) {
    if (ref.slug.length === 0 || seen.has(ref.slug)) {
      continue;
    }
    seen.add(ref.slug);
    out.push(ref);
  }
  return out;
}
