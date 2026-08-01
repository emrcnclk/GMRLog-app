import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/theme-provider';
import type { SemanticRadiusToken } from '../theme/tokens';

/** Common artwork ratios — named so callers stop hand-rolling magic numbers. */
export const ASPECT = {
  /** Box art / key art portrait (IGDB cover). */
  cover: 3 / 4,
  /** Hero banner. */
  hero: 16 / 9,
  /** Wide capsule / library shelf tile. */
  capsule: 92 / 43,
  /** Square. */
  square: 1,
} as const;

export type AspectName = keyof typeof ASPECT;

export interface AspectBoxProps {
  children?: ReactNode;
  /** Named ratio, or a raw width/height number. */
  ratio?: AspectName | number;
  radius?: SemanticRadiusToken;
  /** Fills the reserved area before content paints — prevents a flash of background. */
  placeholderTone?: 'surface' | 'transparent';
  style?: ViewStyle | ViewStyle[];
}

/**
 * Reserves layout space at a fixed ratio *before* its child measures, so images
 * arriving late can never reflow the page. Every artwork surface goes through
 * this — it is the reason the redesigned screens have no layout shift.
 */
export function AspectBox({
  children,
  ratio = 'cover',
  radius = 'radius.lg',
  placeholderTone = 'surface',
  style,
}: AspectBoxProps) {
  const theme = useTheme();
  const resolved = typeof ratio === 'number' ? ratio : ASPECT[ratio];

  return (
    <View
      style={[
        {
          width: '100%',
          aspectRatio: resolved,
          borderRadius: theme.radius(radius),
          overflow: 'hidden',
          backgroundColor:
            placeholderTone === 'surface' ? theme.color('color.surface.secondary') : 'transparent',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
