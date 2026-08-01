import { useEffect, useRef } from 'react';
import { Animated, View, type ViewStyle } from 'react-native';

import { useReduceMotion } from '../motion/motion-provider';
import { resolveDuration } from '../motion/tokens';
import { useTheme } from '../theme/theme-provider';
import type { SemanticColorToken } from '../theme/tokens';

export interface ProgressBarProps {
  /** Completed amount. Clamped into `[0, target]`. */
  value: number;
  /** Total required. Values `<= 0` render an empty track rather than dividing by zero. */
  target: number;
  /** Track thickness in px. */
  height?: number;
  fillColor?: SemanticColorToken;
  trackColor?: SemanticColorToken;
  /** Announced to assistive tech; omit only when an adjacent label already says it. */
  accessibilityLabel?: string;
  style?: ViewStyle | ViewStyle[];
}

/**
 * Determinate progress track. Animates width on change unless reduce-motion is on,
 * and exposes the real numbers via the progressbar a11y role.
 */
export function ProgressBar({
  value,
  target,
  height = 6,
  fillColor = 'color.accent.default',
  trackColor = 'color.background.tertiary',
  accessibilityLabel,
  style,
}: ProgressBarProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const ratio = target > 0 ? Math.max(0, Math.min(1, value / target)) : 0;
  const animated = useRef(new Animated.Value(ratio)).current;

  useEffect(() => {
    if (reduceMotion) {
      animated.setValue(ratio);
      return;
    }
    const animation = Animated.timing(animated, {
      toValue: ratio,
      duration: resolveDuration('slow', false),
      // Width cannot run on the native driver.
      useNativeDriver: false,
    });
    animation.start();
    return () => {
      animation.stop();
    };
  }, [animated, ratio, reduceMotion]);

  const width = animated.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{
        min: 0,
        max: Math.max(0, target),
        now: Math.max(0, Math.min(value, target)),
      }}
      style={[
        {
          height,
          borderRadius: theme.radius('radius.full'),
          backgroundColor: theme.color(trackColor),
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          width,
          height: '100%',
          borderRadius: theme.radius('radius.full'),
          backgroundColor: theme.color(fillColor),
        }}
      />
    </View>
  );
}
