import type { ModalProps } from 'react-native';

import { fadeIn, fadeOut } from './fade';
import { scalePopIn } from './scale';
import { resolveDuration } from './tokens';

export type ModalAnimationType = NonNullable<ModalProps['animationType']>;

export interface ModalMotionPreset {
  animationType: ModalAnimationType;
  backdropOpacity: number;
  contentFromScale: number;
  contentToScale: number;
  durationMs: number;
}

export function modalMotion(reduceMotion: boolean): ModalMotionPreset {
  if (reduceMotion) {
    return {
      animationType: 'none',
      backdropOpacity: 0.4,
      contentFromScale: 1,
      contentToScale: 1,
      durationMs: 0,
    };
  }
  const fade = fadeIn(false);
  const scale = scalePopIn(false);
  return {
    animationType: 'fade',
    backdropOpacity: 0.4,
    contentFromScale: scale.fromScale,
    contentToScale: scale.toScale,
    durationMs: fade.timing.durationMs,
  };
}

export function dialogExitMs(reduceMotion: boolean): number {
  return fadeOut(reduceMotion).timing.durationMs;
}

export function modalStackDuration(reduceMotion: boolean): number {
  return resolveDuration('normal', reduceMotion);
}
