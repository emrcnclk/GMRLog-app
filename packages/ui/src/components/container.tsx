import type { ReactNode } from 'react';
import { View, type ViewProps, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/theme-provider';

export interface ContainerProps extends Omit<ViewProps, 'style'> {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
}

/**
 * Horizontal reading corridor inset (F4.4 · S4 Inset-like).
 */
export function Container({ children, style, ...rest }: ContainerProps) {
  const theme = useTheme();

  return (
    <View
      {...rest}
      style={[
        {
          width: '100%',
          paddingHorizontal: theme.space('space.4'),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
