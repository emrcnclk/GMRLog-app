import { MOTION_EASING, resolveDuration, type MotionTiming } from './tokens';

export interface ScalePreset {
  fromScale: number;
  toScale: number;
  timing: MotionTiming;
}

export function scalePressIn(reduceMotion: boolean): ScalePreset {
  return {
    fromScale: 1,
    toScale: reduceMotion ? 1 : 0.97,
    timing: {
      durationMs: resolveDuration('fast', reduceMotion),
      easing: MOTION_EASING.emphasize,
    },
  };
}

export function scalePressOut(reduceMotion: boolean): ScalePreset {
  return {
    fromScale: reduceMotion ? 1 : 0.97,
    toScale: 1,
    timing: {
      durationMs: resolveDuration('fast', reduceMotion),
      easing: MOTION_EASING.standard,
    },
  };
}

export function scalePopIn(reduceMotion: boolean): ScalePreset {
  return {
    fromScale: reduceMotion ? 1 : 0.94,
    toScale: 1,
    timing: {
      durationMs: resolveDuration('normal', reduceMotion),
      easing: MOTION_EASING.enter,
    },
  };
}
