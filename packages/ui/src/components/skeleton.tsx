import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, View, type ViewStyle } from 'react-native';

import { useReduceMotion } from '../motion/motion-provider';
import { useTheme } from '../theme/theme-provider';
import type { SemanticSpaceToken } from '../theme/tokens';

export type SkeletonShape = 'line' | 'rect' | 'circle';

export interface SkeletonProps {
  shape?: SkeletonShape;
  width?: number | `${number}%`;
  height?: number;
  /** Soft opacity pulse — disabled when reduce motion is on. */
  shimmer?: boolean;
  style?: ViewStyle | ViewStyle[];
}

const DEFAULT_HEIGHT: Record<SkeletonShape, SemanticSpaceToken> = {
  line: 'space.3',
  rect: 'space.12',
  circle: 'space.10',
};

/**
 * Placeholder bone — shape only, never fake content text (S4 SkeletonBone).
 * Optional shimmer respects effective reduce-motion (OS ∨ settings).
 */
export function Skeleton({ shape = 'line', width, height, shimmer = true, style }: SkeletonProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const opacity = useRef(new Animated.Value(1)).current;
  const resolvedHeight = height ?? theme.space(DEFAULT_HEIGHT[shape]);
  const isCircle = shape === 'circle';
  const resolvedWidth = width ?? (isCircle ? resolvedHeight : '100%');

  useEffect(() => {
    if (!shimmer || reduceMotion) {
      opacity.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();

    return () => {
      loop.stop();
      opacity.setValue(1);
    };
  }, [opacity, shimmer, reduceMotion]);

  return (
    <Animated.View
      accessibilityRole="none"
      accessibilityLabel="Loading placeholder"
      style={[
        {
          width: resolvedWidth,
          height: resolvedHeight,
          borderRadius: isCircle
            ? theme.radius('radius.full')
            : theme.radius(shape === 'line' ? 'radius.sm' : 'radius.md'),
          backgroundColor: theme.color('color.surface.secondary'),
          opacity,
        },
        style,
      ]}
    />
  );
}

/** Convenience wrapper for stacked skeleton rows. */
export function SkeletonBlock({
  children,
  style,
  accessibilityLabel,
}: {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  accessibilityLabel?: string;
}) {
  return (
    <View accessibilityLabel={accessibilityLabel} style={style}>
      {children}
    </View>
  );
}
