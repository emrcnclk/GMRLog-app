import { useMemo } from 'react';
import { View, type ViewStyle } from 'react-native';

export type ScrimDirection = 'to-top' | 'to-bottom' | 'to-start' | 'to-end';

export interface GradientScrimProps {
  /** Where the scrim reaches full strength. `to-top` darkens the bottom edge. */
  direction?: ScrimDirection;
  /** Peak alpha at the strong edge (0–1). */
  intensity?: number;
  /** Base colour as an `R,G,B` triple. Defaults to near-black. */
  rgb?: string;
  /** Number of interpolation bands. More bands = smoother, slightly more views. */
  bands?: number;
  style?: ViewStyle | ViewStyle[];
}

const AXIS: Record<ScrimDirection, 'vertical' | 'horizontal'> = {
  'to-top': 'vertical',
  'to-bottom': 'vertical',
  'to-start': 'horizontal',
  'to-end': 'horizontal',
};

/**
 * Legibility scrim over artwork, built from stacked bands so the design system
 * takes no gradient dependency. Alpha follows an ease-in curve, which reads as a
 * smooth ramp rather than the visible stepping a linear ramp produces.
 *
 * Purely decorative — never announced to assistive tech.
 */
export function GradientScrim({
  direction = 'to-top',
  intensity = 0.85,
  rgb = '0,0,0',
  bands = 12,
  style,
}: GradientScrimProps) {
  const segments = useMemo(() => {
    const count = Math.max(2, Math.min(24, Math.round(bands)));
    const peak = Math.max(0, Math.min(1, intensity));
    const vertical = AXIS[direction] === 'vertical';
    // `to-top` / `to-start` put the strong edge last in layout order.
    const strongEdgeLast = direction === 'to-top' || direction === 'to-start';

    return Array.from({ length: count }, (_, index) => {
      const t = (index + 1) / count;
      const progress = strongEdgeLast ? t : 1 - t;
      // Ease-in: alpha stays near zero longer, then ramps — hides banding.
      const alpha = peak * progress * progress;
      return {
        key: `scrim-${String(index)}`,
        flex: 1,
        backgroundColor: `rgba(${rgb},${alpha.toFixed(3)})`,
        vertical,
      };
    });
  }, [bands, direction, intensity, rgb]);

  const vertical = AXIS[direction] === 'vertical';

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          flexDirection: vertical ? 'column' : 'row',
        },
        style,
      ]}
    >
      {segments.map((segment) => (
        <View key={segment.key} style={{ flex: 1, backgroundColor: segment.backgroundColor }} />
      ))}
    </View>
  );
}
