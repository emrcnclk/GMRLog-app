import { describe, expect, it } from 'vitest';

import type { ButtonSize, ButtonVariant } from '../components/button';
import { createThemeTokens } from '../theme/palettes';

const VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'ghost', 'danger'];
const SIZES: ButtonSize[] = ['sm', 'md', 'lg'];

describe('Button contract tokens', () => {
  it('exposes interactive colors for all button variants', () => {
    const tokens = createThemeTokens('light');

    expect(tokens.color['color.interactive.primary']).toBeTruthy();
    expect(tokens.color['color.interactive.secondary']).toBeTruthy();
    expect(tokens.color['color.interactive.disabled']).toBeTruthy();
    expect(tokens.color['color.status.error']).toBeTruthy();
    expect(VARIANTS).toHaveLength(4);
    expect(SIZES).toHaveLength(3);
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
