import { useMemo } from 'react';
import { View, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/theme-provider';
import type { SemanticColorToken } from '../theme/tokens';

export interface HatchOverlayProps {
  /** Line opacity, 0–1. Doc's texture reads as "barely there" at ~0.045. */
  opacity?: number;
  color?: SemanticColorToken;
  /** Gap between lines, px. */
  spacing?: number;
  style?: ViewStyle | ViewStyle[];
}

/**
 * Diagonal-hatch texture over a hero or player-record surface (§5, §6).
 *
 * Built from plain rotated `View` strips, the same "no new rendering
 * dependency" call `GradientScrim` already made for its own fade — a
 * generous oversized square of horizontal lines is rotated 45° and clipped
 * by the parent's bounds, so it never needs to measure the container first.
 * Purely decorative; hidden from assistive tech.
 */
export function HatchOverlay({ opacity = 0.045, color, spacing = 18, style }: HatchOverlayProps) {
  const theme = useTheme();
  const lineColor = theme.color(color ?? 'color.border.default');

  const lines = useMemo(() => {
    const size = 2200;
    const count = Math.ceil(size / spacing);
    return Array.from({ length: count }, (_, index) => index * spacing);
  }, [spacing]);

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
        style,
      ]}
    >
      <View
        style={{
          position: 'absolute',
          width: 2200,
          height: 2200,
          left: -1100,
          top: -1100,
          transform: [{ rotate: '45deg' }],
        }}
      >
        {lines.map((top) => (
          <View
            key={top}
            style={{
              position: 'absolute',
              top,
              left: 0,
              width: 2200,
              height: 1,
              backgroundColor: lineColor,
              opacity,
            }}
          />
        ))}
      </View>
    </View>
  );
}
