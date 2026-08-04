import { View, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/theme-provider';
import type { SemanticColorToken } from '../theme/tokens';

export interface CornerNotchProps {
  /** Arm length in px. The prototype's mark is 22. */
  length?: number;
  /** Draws the vertical arm as well, turning the rule into a corner. */
  vertical?: boolean;
  color?: SemanticColorToken;
  style?: ViewStyle | ViewStyle[];
}

/**
 * The system's signature mark (SCREEN_REDESIGNS.md §"Shared patterns"): a 22×1
 * accent rule at the top-left of a container, optionally paired with a 1×22
 * vertical. Used on cover art, sponsored cards, the DNA panel and the player
 * card.
 *
 * It is cheap and unmistakable, and it costs no colour — which is the point.
 * The mark reads as a mark in monochrome, so a screen that leans on it still
 * works on the `neutral` accent. Prefer it over a tint or a fill whenever a
 * container needs to be singled out.
 *
 * Positioned absolutely against its parent, so the parent needs no layout change
 * to carry one. Purely decorative — never announced to assistive tech, because
 * whatever the notch is marking has to say so in words as well.
 */
export function CornerNotch({
  length = 22,
  vertical = false,
  color = 'color.accent.default',
  style,
}: CornerNotchProps) {
  const theme = useTheme();
  const stroke = theme.color(color);

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ position: 'absolute', top: 0, left: 0 }, style]}
    >
      <View style={{ width: length, height: 1, backgroundColor: stroke }} />
      {vertical ? <View style={{ width: 1, height: length, backgroundColor: stroke }} /> : null}
    </View>
  );
}
