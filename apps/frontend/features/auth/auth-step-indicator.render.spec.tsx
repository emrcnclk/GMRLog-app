// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { renderWithTheme, screen } from '../../test-support/render';

import { AuthStepIndicator } from './auth-step-indicator';
import { REGISTER_STEPS, REGISTER_SUBTITLE } from './register-steps';

/**
 * Two things this pins, both of which were wrong on the shipped screen and
 * neither of which a pure-logic test could see.
 *
 * The copy said "Three steps" while this indicator, directly beneath it, read
 * "Step 1 of 4" — 12.4c added the profile step and left the prose behind.
 * `register-steps.spec.ts` now ties the wording to `REGISTER_STEPS.length`;
 * this closes the other half by asserting the rendered indicator agrees.
 *
 * And the value reaches the DOM at all: CLAUDE.md records that
 * `accessibilityValue` is dropped by RNW, so a `progressbar` announced its
 * label and nothing else until `aria-valuenow` was added alongside.
 */
describe('AuthStepIndicator', () => {
  it('announces the step as a progressbar with real values, not just a label', () => {
    renderWithTheme(<AuthStepIndicator count={4} activeIndex={0} />);

    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('1');
    expect(bar.getAttribute('aria-valuemin')).toBe('1');
    expect(bar.getAttribute('aria-valuemax')).toBe('4');
  });

  it('agrees with the subtitle about how many steps there are', () => {
    renderWithTheme(<AuthStepIndicator count={REGISTER_STEPS.length} activeIndex={0} />);

    const label = screen.getByRole('progressbar').getAttribute('aria-label') ?? '';
    expect(label).toContain(`of ${String(REGISTER_STEPS.length)}`);

    const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six'];
    expect(REGISTER_SUBTITLE.toLowerCase()).toContain(
      `${String(words[REGISTER_STEPS.length])} steps`,
    );
  });

  it('moves with the active step', () => {
    renderWithTheme(<AuthStepIndicator count={4} activeIndex={2} />);

    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('3');
  });
});
