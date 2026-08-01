/**
 * Avatar initials from a display name. Kept in the shared layer so every surface
 * that falls back to initials produces the same two letters for the same player.
 */

/**
 * Split into code points.
 *
 * `Intl.Segmenter` would be more correct for ZWJ emoji sequences, but Hermes
 * does not ship it on every React Native target, so this stays on code points.
 * That is still materially safer than raw index slicing, which cuts surrogate
 * pairs in half and renders as a replacement character.
 */
function codePoints(value: string): string[] {
  // eslint-disable-next-line @typescript-eslint/no-misused-spread -- deliberate: code points are the safest decomposition available on Hermes.
  return [...value];
}

export function userInitials(displayName: string | null | undefined): string {
  const trimmed = (displayName ?? '').trim();
  if (trimmed.length === 0) {
    return '?';
  }

  const words = trimmed.split(/\s+/).filter((word) => word.length > 0);
  const first = words[0] ?? '';
  const last = words[words.length - 1] ?? '';

  if (words.length === 1) {
    // Single word: take the first two characters rather than one, so "gg" and
    // "gm" stay distinguishable in a dense friend list.
    return codePoints(first).slice(0, 2).join('').toUpperCase();
  }

  return `${codePoints(first)[0] ?? ''}${codePoints(last)[0] ?? ''}`.toUpperCase();
}
