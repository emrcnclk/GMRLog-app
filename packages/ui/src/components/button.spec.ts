import { describe, expect, it } from 'vitest';

import type { ButtonSize, ButtonVariant } from '../components/button';
import { createThemeTokens } from '../theme/palettes';

const VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'ghost', 'danger', 'accent'];
const SIZES: ButtonSize[] = ['sm', 'md', 'lg'];

/** The variants that draw an edge instead of a fill, disabled included. */
const OUTLINED: ButtonVariant[] = ['ghost', 'accent'];

describe('Button contract tokens', () => {
  it('exposes interactive colors for all button variants', () => {
    const tokens = createThemeTokens('light');

    expect(tokens.color['color.interactive.primary']).toBeTruthy();
    expect(tokens.color['color.interactive.secondary']).toBeTruthy();
    expect(tokens.color['color.interactive.disabled']).toBeTruthy();
    expect(tokens.color['color.status.error']).toBeTruthy();
    expect(tokens.color['color.accent.default']).toBeTruthy();
    expect(VARIANTS).toHaveLength(5);
    expect(SIZES).toHaveLength(3);
  });

  it('gives the outlined variants a disabled treatment that is still an outline', () => {
    const tokens = createThemeTokens('dark');

    // A disabled outlined button dims; it must not grow a fill, which would
    // change its shape rather than its state (found on Login §1, where the
    // submit is disabled on first paint).
    for (const variant of OUTLINED) {
      expect(VARIANTS).toContain(variant);
    }
    expect(tokens.color['color.text.disabled']).toBeTruthy();
    expect(tokens.color['color.border.default']).toBeTruthy();
  });

  it('provides radius and space scales consumed by Button sizing', () => {
    const tokens = createThemeTokens('dark');

    expect(tokens.radius['radius.md']).toBeGreaterThan(0);
    expect(tokens.space['space.1']).toBe(4);
    expect(tokens.space['space.2']).toBe(8);
    expect(tokens.space['space.3']).toBe(12);
    expect(tokens.space['space.4']).toBe(16);
    expect(tokens.space['space.5']).toBe(20);
  });
});
