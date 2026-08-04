import { Pressable, View, type ViewStyle } from 'react-native';

import { useReduceMotion } from '../motion/motion-provider';
import { pressableMotionStyle } from '../motion/pressable';
import { useTheme } from '../theme/theme-provider';
import type { SemanticColorToken } from '../theme/tokens';

import { Text } from './text';

export interface StatTileProps {
  /** Pre-formatted headline figure — the tile never formats numbers itself. */
  value: string;
  label: string;
  /** Optional secondary line (e.g. "of 214 owned"). */
  caption?: string;
  valueColor?: SemanticColorToken;
  onPress?: () => void;
  /** Overrides the default "<label>, <value>" announcement. */
  accessibilityLabel?: string;
  style?: ViewStyle | ViewStyle[];
}

/**
 * One number and what it means. The atom behind every statistics grid — profile,
 * game hub, collections — so those grids never re-invent their own tile.
 *
 * Reshaped for the redesign (SCREEN_REDESIGNS.md §"Shared patterns"): the tile
 * is no longer a filled card. It carries no surface, no radius and no padding of
 * its own — `MetricStrip` supplies the bounding hairlines and the dividers
 * between tiles, and the tile is just a figure over a tracked-out label.
 *
 * The figure is `title3` (21px/400) against the spec's "19–21px weight 300".
 * There is no 300-weight role at that size in the ten-step ramp, and the design
 * law forbids inlining a size to invent one. `title3` is the ramp's answer;
 * raise it as a missing token if the extra weight ever reads as heavy.
 */
export function StatTile({
  value,
  label,
  caption,
  valueColor = 'color.text.primary',
  onPress,
  accessibilityLabel,
  style,
}: StatTileProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();

  const body = (
    <View style={{ gap: theme.space('space.2'), alignItems: 'center' }}>
      <Text role="title3" color={valueColor} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text role="metaSm" color="color.text.tertiary" numberOfLines={1}>
        {label}
      </Text>
      {caption !== undefined ? (
        <Text role="metaSm" color="color.text.tertiary" numberOfLines={1}>
          {caption}
        </Text>
      ) : null}
    </View>
  );

  const frame: ViewStyle = {
    flex: 1,
    paddingVertical: theme.space('space.3'),
    paddingHorizontal: theme.space('space.2'),
    justifyContent: 'center',
  };

  if (!onPress) {
    return <View style={[frame, style]}>{body}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? `${label}, ${value}`}
      onPress={onPress}
      style={({ pressed }) => [
        frame,
        ...(Array.isArray(style) ? style : style ? [style] : []),
        pressableMotionStyle(pressed, reduceMotion),
      ]}
    >
      {body}
    </Pressable>
  );
}
