import type { ReactNode } from 'react';
import { View, type ViewProps, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/theme-provider';

export interface CardProps extends Omit<ViewProps, 'style'> {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
}

/**
 * Content container surface — place, not decoration (F4.5 · F4.7).
 *
 * No drop shadow (THEME_MIGRATION.md §5): depth comes from surface lightness
 * and the hairline, not from a cast shadow. Shadows are reserved for dialogs,
 * sheets and tinted accent glows.
 */
export function Card({ children, style, ...rest }: CardProps) {
  const theme = useTheme();

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
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
