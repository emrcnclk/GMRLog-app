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
 *
 * **`edges` is the only control over the inset.** It applies `space.4` per
 * *listed* edge, on that edge alone. Passing padding through `style` does not
 * neutralise it: `style` wins per property, so `{ paddingTop: 0, paddingBottom: 0 }`
 * zeroes the vertical axis and leaves `paddingLeft`/`paddingRight` untouched.
 * Four screens shipped `edges={['left','right','bottom']}` with exactly that
 * override believing it turned the shell off, and each kept a hidden 16px
 * horizontal inset that stacked on the gutter the content already carried
 * (3b.2b measured the survivors). To turn the inset off, pass `edges={[]}`.
 *
 * The axis is deliberately *not* a second prop: `edges` already expresses it,
 * and two ways to say the same thing is what made the first one easy to misread.
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
