import { describe, expect, it } from 'vitest';

import { createThemeTokens } from './palettes';

/**
 * The kicker's rule lives in the type ramp, not in the component, so it is
 * pinned here — a spec that imported `SectionKicker` would pull in React Native,
 * which Vitest cannot parse (`import typeof`). Same reason as
 * `rarity-geometry.spec.ts`.
 *
 * SCREEN_REDESIGNS.md §"Shared patterns" specifies the kicker as monospace,
 * uppercase, tracked out and tertiary. `metaSm` is the role that carries it.
 */
describe('section kicker typography', () => {
  const type = createThemeTokens('dark').typography;

  it('is monospace and uppercase, so metadata never reads as a sentence', () => {
    expect(type.metaSm.fontFamily).toBe(type.meta.fontFamily);
    expect(type.metaSm.textTransform).toBe('uppercase');
  });

  it('is tracked out — the spec asks for ~0.14em at 9px', () => {
    const em = type.metaSm.letterSpacing / type.metaSm.fontSize;
    expect(em).toBeGreaterThan(0.12);
    expect(em).toBeLessThan(0.16);
  });

  it('sits below every sans role, so a kicker can never out-shout its section', () => {
    for (const role of ['display', 'title1', 'title2', 'title3', 'headline', 'body'] as const) {
      expect(type.metaSm.fontSize).toBeLessThan(type[role].fontSize);
    }
  });

  it('stays within the 300-500 weight band the design law allows', () => {
    expect(Number(type.metaSm.fontWeight)).toBeGreaterThanOrEqual(300);
    expect(Number(type.metaSm.fontWeight)).toBeLessThanOrEqual(500);
  });
});
