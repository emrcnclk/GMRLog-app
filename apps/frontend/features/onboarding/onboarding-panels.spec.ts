import { describe, expect, it } from 'vitest';

import { isLastOnboardingPanel, nextOnboardingPanel, ONBOARDING_PANELS } from './onboarding-panels';

describe('onboarding panels', () => {
  it('carries §3’s three panels, in order', () => {
    expect(ONBOARDING_PANELS).toHaveLength(3);
    expect(ONBOARDING_PANELS.map((panel) => panel.title)).toEqual([
      'Every game you finish becomes part of the record.',
      'Your profile answers one question: what kind of gamer are you?',
      'Find the next one from people who play like you.',
    ]);
  });

  it('gives every panel a body', () => {
    for (const panel of ONBOARDING_PANELS) {
      expect(panel.body.length).toBeGreaterThan(0);
    }
  });

  it('marks only the last index as last', () => {
    expect(isLastOnboardingPanel(0)).toBe(false);
    expect(isLastOnboardingPanel(1)).toBe(false);
    expect(isLastOnboardingPanel(2)).toBe(true);
  });

  it('advances one panel at a time and clamps at the end', () => {
    expect(nextOnboardingPanel(0)).toBe(1);
    expect(nextOnboardingPanel(1)).toBe(2);
    // Past the last panel the caller completes; the index must not wrap to zero
    // and drop the player back on panel one.
    expect(nextOnboardingPanel(2)).toBe(2);
  });
});
