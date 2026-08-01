import { MOTION_DURATION, MOTION_EASING, resolveDuration, type MotionTiming } from './tokens';

export interface FadePreset {
  fromOpacity: number;
  toOpacity: number;
  timing: MotionTiming;
}

export function fadeIn(reduceMotion: boolean): FadePreset {
  return {
    fromOpacity: reduceMotion ? 1 : 0,
    toOpacity: 1,
    timing: {
      durationMs: resolveDuration('normal', reduceMotion),
      easing: MOTION_EASING.enter,
    },
  };
}

export function fadeOut(reduceMotion: boolean): FadePreset {
  return {
    fromOpacity: 1,
    toOpacity: reduceMotion ? 1 : 0,
    timing: {
      durationMs: resolveDuration('fast', reduceMotion),
      easing: MOTION_EASING.exit,
    },
  };
}

export function fadeCross(reduceMotion: boolean): FadePreset {
  return {
    fromOpacity: reduceMotion ? 1 : 0.35,
    toOpacity: 1,
    timing: {
      durationMs: resolveDuration('fast', reduceMotion),
      easing: MOTION_EASING.standard,
    },
  };
}

export const FADE_IMAGE_TRANSITION_MS = MOTION_DURATION.normal;
