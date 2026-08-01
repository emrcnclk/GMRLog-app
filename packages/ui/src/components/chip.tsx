import { Pressable, View, type PressableProps, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/theme-provider';

import { Text } from './text';

export interface ChipProps extends Omit<PressableProps, 'children' | 'style'> {
  children: string;
  selected?: boolean;
  disabled?: boolean;
  /**
   * D3.27 — set false for read-only tags (a game's genres, a player's platforms).
   * Renders a plain View so assistive tech is not told about a button that does
   * nothing when activated.
   */
  interactive?: boolean;
  style?: ViewStyle | ViewStyle[];
}

/**
 * Filter / facet token — optional selected state (S4 Chip · F4.7).
 */
export function Chip({
  children,
  selected = false,
  disabled = false,
  interactive = true,
  style,
  ...rest
}: ChipProps) {
  const theme = useTheme();

  const surface = (pressed: boolean): ViewStyle => ({
    alignSelf: 'flex-start',
    paddingHorizontal: theme.space('space.3'),
    paddingVertical: theme.space('space.1'),
    borderRadius: theme.radius('radius.full'),
    borderWidth: 1,
    borderColor: theme.color(selected ? 'color.interactive.primary' : 'color.border.default'),
    backgroundColor: selected
      ? theme.color('color.interactive.primary')
      : theme.color('color.surface.secondary'),
    opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
  });

  const label = (
    <Text role="label" color={selected ? 'color.text.inverse' : 'color.text.primary'}>
      {children}
    </Text>
  );

  if (!interactive) {
    return <View style={[surface(false), style]}>{label}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      style={({ pressed }) => [surface(pressed), style]}
      {...rest}
    >
      {label}
    </Pressable>
  );
}
