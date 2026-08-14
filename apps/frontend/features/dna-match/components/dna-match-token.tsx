import type { DnaBand, DnaMatch } from '@gmrlog/types';
import { HIDDEN_FROM_ASSISTIVE_TECH, Text, useTheme } from '@gmrlog/ui';
import { View } from 'react-native';

export type DnaMatchTokenVariant = 'row' | 'inline';

export interface DnaMatchTokenProps {
  /**
   * Absent is meaningful, not an error: the breakdown is unavailable — no
   * enough shared data, or the subject is an organisation account (none of
   * `SimilarUserResponse`, `FriendshipResponse` or `CommunityMemberResponse`
   * carries an account-type flag today, so both cases collapse to the same
   * "no match" signal at the row level; see README.md §1). Render nothing
   * rather than a fabricated 0%.
   */
  match?: DnaMatch;
  /**
   * 'row' — its own line with the 14×1 accent rule glyph (README.md §4,
   * friends list). 'inline' — appended to an existing line, dot-separated,
   * no rule glyph (README.md §2c, community member rows).
   */
  variant?: DnaMatchTokenVariant;
}

/** Shared with `DnaMatchPanel` (6.4) so the panel's band label never drifts from the token's. */
export const BAND_LABEL: Record<DnaBand, string> = {
  'near-identical': 'Near-identical DNA',
  strong: 'Strong overlap',
  partial: 'Partial overlap',
  different: 'Different shelf',
};

function isAccentBand(band: DnaBand): boolean {
  return band === 'near-identical' || band === 'strong';
}

/** Composable a11y sentence for the enclosing row's own `accessibilityLabel` — README.md's accessibility section wants the match announced as a sentence, not a bare number, and every call site already owns a row-level label. */
export function dnaMatchAccessibilityPhrase(match: DnaMatch): string {
  return `${String(match.percent)} percent DNA match, ${BAND_LABEL[match.band].toLowerCase()}`;
}

/**
 * README.md §1 "match token" — the one shared token, reused by
 * `similar-users-section.tsx`, `friend-card.tsx` and
 * `community-member-card.tsx`. It reads the server's band only; there is no
 * client-side threshold on a raw score anywhere in this file.
 *
 * Always rendered nested inside an already-labelled tappable row, so the
 * token itself stays out of the accessibility tree — `dnaMatchAccessibilityPhrase`
 * is what each call site folds into its own row label.
 */
export function DnaMatchToken({ match, variant = 'row' }: DnaMatchTokenProps) {
  const theme = useTheme();

  if (!match) {
    return null;
  }

  const tone = isAccentBand(match.band) ? 'color.accent.default' : 'color.text.tertiary';

  if (variant === 'inline') {
    return (
      <Text role="meta" color={tone} {...HIDDEN_FROM_ASSISTIVE_TECH}>
        {' · '}
        {match.percent}% match
      </Text>
    );
  }

  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space('space.2') }}
      {...HIDDEN_FROM_ASSISTIVE_TECH}
    >
      <View style={{ width: 14, height: 1, backgroundColor: theme.color(tone) }} />
      <Text role="meta" color={tone}>
        {match.percent}% match
      </Text>
    </View>
  );
}
