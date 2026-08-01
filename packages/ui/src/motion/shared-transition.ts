/**
 * Shared / screen transition presets for Expo Router Stack / Tabs.
 * Values map to React Navigation animation names — not invented routes.
 */

export type StackAnimationName =
  'default' | 'fade' | 'fade_from_bottom' | 'none' | 'slide_from_right';

export interface SharedTransitionPreset {
  stackAnimation: StackAnimationName;
  tabAnimationEnabled: boolean;
  cardOpacityOnPress: number;
}

export function sharedTransitionPreset(reduceMotion: boolean): SharedTransitionPreset {
  if (reduceMotion) {
    return {
      stackAnimation: 'none',
      tabAnimationEnabled: false,
      cardOpacityOnPress: 1,
    };
  }
  return {
    stackAnimation: 'fade',
    tabAnimationEnabled: true,
    cardOpacityOnPress: 0.85,
  };
}

export function modalPresentationAnimation(reduceMotion: boolean): StackAnimationName {
  return reduceMotion ? 'none' : 'fade_from_bottom';
}
