import { HIDDEN_FROM_ASSISTIVE_TECH, useReduceMotion, useTheme } from '@gmrlog/ui';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export interface DnaMatchRingProps {
  /** 0-100, already rounded server-side. */
  percent: number;
  /** Outer diameter in px. */
  size: number;
  strokeWidth?: number;
}

const SWEEP_DURATION_MS = 700;
const TICK_MS = 16;

/** Cubic ease-out — matches `MOTION_EASING.enter`'s shape without importing the curve type. */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * The DNA match gauge (`README.md` §1 "ring"): a background circle at
 * `border.default` plus a foreground arc that sweeps clockwise from the top,
 * with an ambient glow at the top two bands. There is no `conic-gradient` in
 * React Native, so this is `react-native-svg` — the same component the panel
 * (6.4) and this rail's card (6.2) both draw, sized by `size` alone.
 *
 * Animates once on mount via a `setInterval` tween writing `strokeDashoffset`
 * through React state — not `Animated.timing`, not Reanimated, and not
 * `requestAnimationFrame`. All three were tried and ruled out on this app's
 * web build:
 * - `Animated.timing` driving `interpolate(transform)` never advances
 *   (CLAUDE.md's "Known platform traps").
 * - Reanimated's `useAnimatedProps` writing `strokeDashoffset` directly on an
 *   `AnimatedCircle` doesn't reach the DOM either — sampled the rendered
 *   attribute across 1.2s on a live 62%-match render and it sat frozen at
 *   the starting (0%-shown) value the entire time, no error, no warning.
 * - A plain `requestAnimationFrame` loop calling `setState` looked right —
 *   it's a normal React re-render, not a native-bridge animation — but
 *   measured frozen too, for a third reason: this environment's preview
 *   pane reports `document.visibilityState: 'hidden'`, and Chromium fully
 *   suspends `rAF` callbacks on hidden documents (not merely throttles them,
 *   per the CLAUDE.md entry this same defect already burned once, on
 *   TanStack Query's retryer). A real user's tab is visible and `rAF` would
 *   run there, but that can't be proven in this harness, and "works for the
 *   user, unverifiable here" is not good enough per this task's own bar.
 *
 * `setInterval` fires regardless of visibility (Chromium clamps a hidden
 * tab's timers to ~1/s, it does not suspend them), so it is the one
 * mechanism provable in this environment and correct in every other. Proof
 * is in the commit message: `stroke-dashoffset` sampled at multiple points
 * during a fresh mount, moving from the full circumference down to the
 * exact match-percent target and holding there.
 */
export function DnaMatchRing({ percent, size, strokeWidth = 3 }: DnaMatchRingProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const finalOffset = circumference * (1 - clamped / 100);
  const accent = theme.color('color.accent.default');

  const [dashOffset, setDashOffset] = useState(reduceMotion ? finalOffset : circumference);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (reduceMotion) {
      setDashOffset(finalOffset);
      return;
    }

    setDashOffset(circumference);
    const from = circumference;
    const to = finalOffset;
    const start = Date.now();

    intervalRef.current = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / SWEEP_DURATION_MS);
      setDashOffset(from + (to - from) * easeOutCubic(t));
      if (t >= 1 && intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, TICK_MS);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [circumference, finalOffset, reduceMotion]);

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
          strokeDashoffset={dashOffset}
          strokeLinecap="butt"
          fill="none"
          transform={`rotate(-90 ${String(size / 2)} ${String(size / 2)})`}
        />
      </Svg>
    </View>
  );
}
