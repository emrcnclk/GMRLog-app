import { fadeIn, useReduceMotion } from '@gmrlog/ui';
import { useEffect, type ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export interface FadeInViewProps {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  /** When false, skip enter animation (e.g. already mounted list row). */
  active?: boolean;
}

/**
 * Screen / section enter fade — Reanimated when motion allowed, instant when reduced.
 */
export function FadeInView({ children, style, active = true }: FadeInViewProps) {
  const reduceMotion = useReduceMotion();
  const opacity = useSharedValue(reduceMotion || !active ? 1 : 0);

  useEffect(() => {
    const preset = fadeIn(reduceMotion || !active);
    opacity.value = withTiming(preset.toOpacity, { duration: preset.timing.durationMs });
  }, [active, opacity, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (reduceMotion || !active) {
    return <View style={style}>{children}</View>;
  }

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
