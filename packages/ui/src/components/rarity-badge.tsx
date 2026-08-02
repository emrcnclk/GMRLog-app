import { View, type ViewStyle } from 'react-native';

import { RARITY_LABELS, rarityGeometry } from '../theme/palettes';
import { useTheme } from '../theme/theme-provider';
import type { RarityTier, SemanticColorToken } from '../theme/tokens';

import { Text } from './text';

const RARITY_TOKEN: Record<RarityTier, SemanticColorToken> = {
  common: 'color.rarity.common',
  uncommon: 'color.rarity.uncommon',
  rare: 'color.rarity.rare',
  epic: 'color.rarity.epic',
  legendary: 'color.rarity.legendary',
};

/** Resolve the semantic colour token for a rarity tier. */
export function rarityColorToken(tier: RarityTier): SemanticColorToken {
  return RARITY_TOKEN[tier];
}

export interface RarityBadgeProps {
  tier: RarityTier;
  /** Overrides the tier name (e.g. "Top 2% of players"). */
  label?: string;
  style?: ViewStyle | ViewStyle[];
}

/**
 * Rarity marker for achievements and archetypes. Outlined rather than filled so a
 * wall of badges stays readable, and always carries the tier word — colour alone
 * is never the only channel, and neither is shape.
 */
export function RarityBadge({ tier, label, style }: RarityBadgeProps) {
  const theme = useTheme();
  const color = theme.color(RARITY_TOKEN[tier]);
  const geometry = rarityGeometry(tier);
  const lift = theme.elevation(geometry.elevation);

  return (
    <View
      style={[
        {
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.space('space.1'),
          paddingHorizontal: theme.space('space.2'),
          paddingVertical: theme.space('space.1'),
          borderRadius: theme.radius(geometry.radius),
          borderWidth: 1,
          borderColor: color,
          // The elevation token supplies the spread; the glow is ambient, so it
          // takes the tier's own colour and drops the token's downward offset.
          ...lift,
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
        },
        style,
      ]}
    >
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: theme.radius('radius.full'),
          backgroundColor: color,
        }}
      />
      <Text role="meta" style={{ color }}>
        {label ?? RARITY_LABELS[tier]}
      </Text>
    </View>
  );
}
