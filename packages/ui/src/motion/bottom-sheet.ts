import type { ModalProps } from 'react-native';

import { slideInFromBottom, slideOutToBottom } from './slide';
import { resolveDuration } from './tokens';

export type SheetAnimationType = NonNullable<ModalProps['animationType']>;

export interface BottomSheetMotionPreset {
  animationType: SheetAnimationType;
  fromOffset: number;
  toOffset: number;
  durationMs: number;
  dismissDistance: number;
}

export function bottomSheetMotion(reduceMotion: boolean): BottomSheetMotionPreset {
  if (reduceMotion) {
    return {
      animationType: 'none',
      fromOffset: 0,
      toOffset: 0,
      durationMs: 0,
      dismissDistance: 0,
    };
  }
  const enter = slideInFromBottom(false, 48);
  const exit = slideOutToBottom(false, 48);
  return {
    animationType: 'slide',
    fromOffset: enter.fromOffset,
    toOffset: enter.toOffset,
    durationMs: enter.timing.durationMs,
    dismissDistance: exit.toOffset,
  };
}

export function sheetSnapDuration(reduceMotion: boolean): number {
  return resolveDuration('deliberate', reduceMotion);
}
