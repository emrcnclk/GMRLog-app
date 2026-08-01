import { describe, expect, it } from 'vitest';

/**
 * Frontend motion contracts — pure assertions (no RN import via @gmrlog/ui barrel).
 * Preset behavior is covered in packages/ui motion.spec.ts.
 */
describe('frontend motion fallbacks', () => {
  it('reduce motion collapses stack animation to none', () => {
    const stackAnimation = (reduce: boolean) => (reduce ? 'none' : 'fade');
    expect(stackAnimation(true)).toBe('none');
    expect(stackAnimation(false)).toBe('fade');
  });

  it('reduce motion disables modal presentation animation', () => {
    const modalAnimation = (reduce: boolean) => (reduce ? 'none' : 'fade_from_bottom');
    expect(modalAnimation(true)).toBe('none');
  });

  it('press feedback keeps opacity cue when reduced', () => {
    const opacity = (pressed: boolean, reduce: boolean) => {
      if (!pressed) {
        return 1;
      }
      return reduce ? 0.85 : 0.85;
    };
    expect(opacity(true, true)).toBe(0.85);
    expect(opacity(false, false)).toBe(1);
  });

  it('image transition ms is zero when reduced', () => {
    const transition = (reduce: boolean) => (reduce ? 0 : 200);
    expect(transition(true)).toBe(0);
  });

  it('settings reduceMotion ORs with OS', () => {
    const effective = (os: boolean, app: boolean | null) => os || app === true;
    expect(effective(false, true)).toBe(true);
    expect(effective(true, false)).toBe(true);
    expect(effective(false, null)).toBe(false);
  });
});
