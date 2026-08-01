import type { ReactNode } from 'react';
import { Pressable, View, type PressableProps, type ViewStyle } from 'react-native';

import { useReduceMotion } from '../motion/motion-provider';
import { MIN_TOUCH_TARGET, pressableMotionStyle } from '../motion/pressable';
import { useTheme } from '../theme/theme-provider';

import { Text } from './text';

export interface ListItemProps extends Omit<PressableProps, 'children' | 'style'> {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  style?: ViewStyle | ViewStyle[];
}

/**
 * Generic list row — title / subtitle / leading / trailing (S4 ListRow).
 */
export function ListItem({
  title,
  subtitle,
  leading,
  trailing,
  style,
  disabled,
  ...rest
}: ListItemProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.space('space.3'),
          paddingVertical: theme.space('space.3'),
          paddingHorizontal: theme.space('space.4'),
          minHeight: MIN_TOUCH_TARGET,
          backgroundColor: theme.color('color.surface.primary'),
          opacity: disabled ? 0.5 : 1,
        },
        pressableMotionStyle(pressed && !disabled, reduceMotion),
        style,
      ]}
      {...rest}
    >
      {leading ? <View>{leading}</View> : null}
      <View style={{ flex: 1, gap: theme.space('space.1') }}>
        <Text role="title" color="color.text.primary">
          {title}
        </Text>
        {subtitle ? (
          <Text role="meta" color="color.text.secondary">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ? <View>{trailing}</View> : null}
    </Pressable>
  );
}
