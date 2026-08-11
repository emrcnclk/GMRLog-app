import { HIDDEN_FROM_ASSISTIVE_TECH, useTheme } from '@gmrlog/ui';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export interface DnaMatchRingProps {
  /** 0-100, already rounded server-side. */
  percent: number;
  /** Outer diameter in px. */
  size: number;
  strokeWidth?: number;
}

/**
 * The DNA match gauge (`README.md` §1 "ring"): a background circle at
 * `border.default` plus a foreground arc that sweeps clockwise from the top,
 * with an ambient glow at the top two bands. There is no `conic-gradient` in
 * React Native, so this is `react-native-svg` — the same component the panel
 * (6.4) and this rail's card (6.2) both draw, sized by `size` alone.
 *
 * Static for now: `Animated.timing` driving `interpolate(transform)` has been
 * measured not advancing at all on this app's web build (CLAUDE.md's "Known
 * platform traps"), and finding a mechanism that actually animates on both
 * platforms is 6.3's own job, not this rail's. A correctly-drawn static ring
 * beats a sliding one that freezes on web.
 */
export function DnaMatchRing({ percent, size, strokeWidth = 3 }: DnaMatchRingProps) {
  const theme = useTheme();
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const accent = theme.color('color.accent.default');

  const glowElevation =
    clamped >= 85
      ? theme.elevation('shadow.md')
      : clamped >= 70
        ? theme.elevation('shadow.sm')
        : null;

  return (
    <View
      {...HIDDEN_FROM_ASSISTIVE_TECH}
      style={[
        { width: size, height: size },
        glowElevation !== null
          ? { ...glowElevation, shadowColor: accent, shadowOffset: { width: 0, height: 0 } }
          : null,
      ]}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${String(size)} ${String(size)}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.color('color.border.default')}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={accent}
          strokeWidth={strokeWidth}
          strokeDasharray={`${String(circumference)} ${String(circumference)}`}
          strokeDashoffset={offset}
          strokeLinecap="butt"
          fill="none"
          transform={`rotate(-90 ${String(size / 2)} ${String(size / 2)})`}
        />
      </Svg>
    </View>
  );
}
