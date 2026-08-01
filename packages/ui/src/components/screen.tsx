import type { ReactNode } from 'react';
import { View, type ViewProps, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/theme-provider';

export type ScreenEdge = 'top' | 'right' | 'bottom' | 'left';

export interface ScreenProps extends Omit<ViewProps, 'style'> {
  children: ReactNode;
  /** Soft inset padding approximating safe areas — no safe-area peer required. */
  edges?: ScreenEdge[];
  style?: ViewStyle | ViewStyle[];
}

/**
 * Full-bleed screen shell — flex + background (structural only).
 */
export function Screen({ children, edges = ['top', 'bottom'], style, ...rest }: ScreenProps) {
  const theme = useTheme();
  const inset = theme.space('space.4');

  return (
    <View
      {...rest}
      style={[
        {
          flex: 1,
          backgroundColor: theme.color('color.background.primary'),
          paddingTop: edges.includes('top') ? inset : 0,
          paddingRight: edges.includes('right') ? inset : 0,
          paddingBottom: edges.includes('bottom') ? inset : 0,
          paddingLeft: edges.includes('left') ? inset : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
