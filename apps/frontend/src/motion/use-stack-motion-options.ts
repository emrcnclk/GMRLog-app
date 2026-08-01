import { modalPresentationAnimation, sharedTransitionPreset, useReduceMotion } from '@gmrlog/ui';
import { useMemo } from 'react';

/** Expo Router Stack screenOptions driven by reduce-motion. */
export function useStackMotionOptions() {
  const reduceMotion = useReduceMotion();
  return useMemo(() => {
    const shared = sharedTransitionPreset(reduceMotion);
    return {
      headerShown: false as const,
      animation: shared.stackAnimation,
      animationDuration: reduceMotion ? 0 : 200,
    };
  }, [reduceMotion]);
}

export function useModalMotionOptions() {
  const reduceMotion = useReduceMotion();
  return useMemo(
    () => ({
      headerShown: false as const,
      presentation: 'modal' as const,
      animation: modalPresentationAnimation(reduceMotion),
      animationDuration: reduceMotion ? 0 : 280,
    }),
    [reduceMotion],
  );
}
