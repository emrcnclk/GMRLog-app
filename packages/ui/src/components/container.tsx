import type { ReactNode } from 'react';
import { View, type ViewProps, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/theme-provider';
import { CONTENT_MAX_WIDTH } from '../theme/tokens';
import { useIsTabletUp } from '../theme/use-breakpoint';

export interface ContainerProps extends Omit<ViewProps, 'style'> {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
}

/**
 * Horizontal reading corridor inset (F4.4 · S4 Inset-like).
 *
 * **9.7 — capped at and above `TABLET_BREAKPOINT`.** `maxWidth:
 * CONTENT_MAX_WIDTH` plus `alignSelf: 'flex-start'`, never centred: Nocturne
 * is left-aligned and asymmetric by principle (flush-left headings, content
 * hugging the left with whitespace on the right — `THEME_MIGRATION.md`), and
 * a centred cap would contradict that on every screen the moment it landed
 * here. Below the breakpoint this is a no-op — still plain `width: '100%'`.
 */
export function Container({ children, style, ...rest }: ContainerProps) {
  const theme = useTheme();
  const isTabletUp = useIsTabletUp();

  return (
    <View
      {...rest}
      style={[
        {
          width: '100%',
          paddingHorizontal: theme.space('space.4'),
        },
        isTabletUp ? { maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'flex-start' } : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}
