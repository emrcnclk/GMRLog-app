import { MOTION_EASING, resolveDuration, type MotionTiming } from './tokens';

export type SlideAxis = 'x' | 'y';

export interface SlidePreset {
  axis: SlideAxis;
  fromOffset: number;
  toOffset: number;
  timing: MotionTiming;
}

export function slideInFromBottom(reduceMotion: boolean, distance = 24): SlidePreset {
  return {
    axis: 'y',
    fromOffset: reduceMotion ? 0 : distance,
    toOffset: 0,
    timing: {
      durationMs: resolveDuration('normal', reduceMotion),
      easing: MOTION_EASING.enter,
    },
  };
}

export function slideOutToBottom(reduceMotion: boolean, distance = 24): SlidePreset {
  return {
    axis: 'y',
    fromOffset: 0,
    toOffset: reduceMotion ? 0 : distance,
    timing: {
      durationMs: resolveDuration('fast', reduceMotion),
      easing: MOTION_EASING.exit,
    },
  };
}

export function slideInFromEnd(reduceMotion: boolean, distance = 16): SlidePreset {
  return {
    axis: 'x',
    fromOffset: reduceMotion ? 0 : distance,
    toOffset: 0,
    timing: {
      durationMs: resolveDuration('normal', reduceMotion),
      easing: MOTION_EASING.enter,
    },
  };
}
