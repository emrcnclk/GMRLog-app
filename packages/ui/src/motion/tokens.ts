/**
 * Motion duration tokens — meaning before ms decoration (F4.9).
 * Consumers map these to Animated / Reanimated timing.
 */
export const MOTION_DURATION = {
  instant: 0,
  fast: 120,
  normal: 200,
  slow: 320,
  deliberate: 420,
} as const;

export type MotionDurationToken = keyof typeof MOTION_DURATION;

export const MOTION_EASING = {
  standard: 'standard',
  enter: 'enter',
  exit: 'exit',
  emphasize: 'emphasize',
} as const;

export type MotionEasingToken = keyof typeof MOTION_EASING;

export interface MotionTiming {
  durationMs: number;
  easing: MotionEasingToken;
}

export function resolveDuration(token: MotionDurationToken, reduceMotion: boolean): number {
  if (reduceMotion) {
    return MOTION_DURATION.instant;
  }
  return MOTION_DURATION[token];
}
