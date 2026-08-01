import type { ReactNode } from 'react';
import { View, type ViewProps, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/theme-provider';

export interface CardProps extends Omit<ViewProps, 'style'> {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
}

/**
 * Content container surface — place, not decoration (F4.5 · F4.7).
 */
export function Card({ children, style, ...rest }: CardProps) {
  const theme = useTheme();
  const shadow = theme.elevation('shadow.sm');

  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: theme.color('color.surface.card'),
          borderRadius: theme.radius('radius.lg'),
          borderWidth: 1,
          borderColor: theme.color('color.border.default'),
          padding: theme.space('space.4'),
          ...shadow,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
