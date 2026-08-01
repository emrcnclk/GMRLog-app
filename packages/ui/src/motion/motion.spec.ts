import { describe, expect, it } from 'vitest';

import { bottomSheetMotion } from './bottom-sheet';
import { fadeCross, fadeIn, fadeOut } from './fade';
import { modalMotion } from './modal';
import { PRESS_OPACITY, pressableMotionStyle } from './pressable';
import { scalePopIn, scalePressIn } from './scale';
import { modalPresentationAnimation, sharedTransitionPreset } from './shared-transition';
import { slideInFromBottom } from './slide';
import { MOTION_DURATION, resolveDuration } from './tokens';

describe('ui motion system', () => {
  it('resolves durations to instant when reduce motion', () => {
    expect(resolveDuration('normal', true)).toBe(0);
    expect(resolveDuration('normal', false)).toBe(MOTION_DURATION.normal);
  });

  it('fade presets collapse under reduce motion', () => {
    expect(fadeIn(true).fromOpacity).toBe(1);
    expect(fadeIn(true).timing.durationMs).toBe(0);
    expect(fadeOut(false).toOpacity).toBe(0);
    expect(fadeCross(false).fromOpacity).toBeLessThan(1);
  });

  it('scale press is identity under reduce motion', () => {
    expect(scalePressIn(true).toScale).toBe(1);
    expect(scalePopIn(false).fromScale).toBeLessThan(1);
  });

  it('slide offsets collapse under reduce motion', () => {
    expect(slideInFromBottom(true).fromOffset).toBe(0);
    expect(slideInFromBottom(false).fromOffset).toBeGreaterThan(0);
  });

  it('shared transitions use none when reduced', () => {
    expect(sharedTransitionPreset(true).stackAnimation).toBe('none');
    expect(sharedTransitionPreset(false).stackAnimation).toBe('fade');
    expect(modalPresentationAnimation(true)).toBe('none');
  });

  it('pressable opacity uses canonical constant', () => {
    expect(pressableMotionStyle(true, true).opacity).toBe(PRESS_OPACITY);
    expect(pressableMotionStyle(true, false).transform?.[0]?.scale).toBeLessThan(1);
    expect(pressableMotionStyle(false, false).opacity).toBe(1);
  });

  it('modal and sheet animation types respect reduce motion', () => {
    expect(modalMotion(true).animationType).toBe('none');
    expect(modalMotion(false).animationType).toBe('fade');
    expect(bottomSheetMotion(true).animationType).toBe('none');
    expect(bottomSheetMotion(false).animationType).toBe('slide');
  });
});
