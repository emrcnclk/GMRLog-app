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
    <View style={{ gap: theme.space('space.1') }}>
      <Text role="heading" color={valueColor} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text role="caption" color="color.text.secondary" numberOfLines={1}>
        {label}
      </Text>
      {caption !== undefined ? (
        <Text role="meta" color="color.text.tertiary" numberOfLines={1}>
          {caption}
        </Text>
      ) : null}
    </View>
  );

  const frame: ViewStyle = {
    flex: 1,
    minWidth: theme.space('space.20'),
    paddingVertical: theme.space('space.3'),
    paddingHorizontal: theme.space('space.3'),
    borderRadius: theme.radius('radius.lg'),
    backgroundColor: theme.color('color.surface.secondary'),
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
