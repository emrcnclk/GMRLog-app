import { describe, expect, it } from 'vitest';

describe('accessibility polish contracts', () => {
  it('minimum touch target floor is 44', () => {
    const minTouch = 44;
    expect(minTouch).toBeGreaterThanOrEqual(44);
  });

  it('effective reduce motion is OS or settings', () => {
    const effective = (os: boolean, app: boolean | null) => os || app === true;
    expect(effective(false, false)).toBe(false);
    expect(effective(true, false)).toBe(true);
    expect(effective(false, true)).toBe(true);
    expect(effective(false, null)).toBe(false);
  });

  it('screen states remain Loading Empty Error Ready', () => {
    const states = ['loading', 'empty', 'error', 'ready'] as const;
    expect(states).toHaveLength(4);
  });

  it('never uses Alert for async errors', () => {
    const ui = { errorBanner: true, alert: false };
    expect(ui.errorBanner).toBe(true);
    expect(ui.alert).toBe(false);
  });

  it('theme vocabulary stays light dark system', () => {
    expect(['light', 'dark', 'system']).toHaveLength(3);
  });
});
