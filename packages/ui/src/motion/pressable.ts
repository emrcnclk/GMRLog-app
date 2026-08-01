import type { ViewStyle } from 'react-native';

import { scalePressIn, scalePressOut } from './scale';

/** Canonical pressed opacity for Pressable / ListItem / cards (F4.9 continuity). */
export const PRESS_OPACITY = 0.85;

/** Minimum touch target — space.12 semantic floor (44pt class). */
export const MIN_TOUCH_TARGET = 44;

export interface PressableMotionStyle {
  opacity: number;
  transform?: [{ scale: number }];
}

export function pressableMotionStyle(
  pressed: boolean,
  reduceMotion: boolean,
): PressableMotionStyle {
  if (!pressed) {
    return { opacity: 1 };
  }
  if (reduceMotion) {
    return { opacity: PRESS_OPACITY };
  }
  const scale = scalePressIn(false).toScale;
  return {
    opacity: PRESS_OPACITY,
    transform: [{ scale }],
  };
}

export function pressableStyleArray(
  pressed: boolean,
  reduceMotion: boolean,
  base?: ViewStyle | ViewStyle[],
): (ViewStyle | false | undefined)[] {
  const motion = pressableMotionStyle(pressed, reduceMotion);
  return [...(Array.isArray(base) ? base : [base]), motion];
}

export function releasePressScale(reduceMotion: boolean): number {
  return scalePressOut(reduceMotion).toScale;
}
