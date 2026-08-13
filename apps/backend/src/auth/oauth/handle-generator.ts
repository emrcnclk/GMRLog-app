const MIN_HANDLE_LENGTH = 3;
const MAX_HANDLE_LENGTH = 24;
const MAX_BASE_LENGTH = MAX_HANDLE_LENGTH - 3; // room for a 3-digit dedupe suffix
const FALLBACK_BASE = 'player';

// Combining Diacritical Marks block (U+0300-U+036F). Stripped after NFKD
// decomposition so accented latin letters (e.g. base "e" + acute accent)
// reduce to their base letter instead of being dropped outright.
const COMBINING_MARKS_START = 0x0300;
const COMBINING_MARKS_END = 0x036f;

function stripCombiningMarks(input: string): string {
  return Array.from(input)
    .filter((char) => {
      const code = char.codePointAt(0) ?? 0;
      return code < COMBINING_MARKS_START || code > COMBINING_MARKS_END;
    })
    .join('');
}

/**
 * Slugifies a provider display name into the `handleSchema` charset
 * (`^[a-z0-9_]{3,24}$`, `packages/validators`) — OAUTH.md §3 rule 4. Pure: no
 * I/O, no uniqueness check. Falls back to a fixed base when the input has
 * fewer than 3 slug-able characters (emoji-only names, CJK names that
 * transliterate to nothing, etc.) — the caller's dedupe loop still makes the
 * final handle unique.
 */
export function baseHandleFromDisplayName(displayName: string): string {
  const slug = stripCombiningMarks(displayName.normalize('NFKD'))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, MAX_BASE_LENGTH);

  return slug.length >= MIN_HANDLE_LENGTH ? slug : FALLBACK_BASE;
}
