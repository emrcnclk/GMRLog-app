import { describe, expect, it } from 'vitest';

import {
  ACCENT_KEYS,
  ACCENT_LABELS,
  RARITY_LABELS,
  RARITY_TIERS,
  createThemeTokens,
} from './palettes';

/**
 * D3.27 accent + rarity token families. The invariant that matters: an accent
 * may only remap `color.accent.*`. If a future accent touches anything else,
 * contrast guarantees elsewhere in the app stop holding.
 */
describe('accent tokens', () => {
  it('defaults to the neutral accent, preserving the frozen monochrome palette', () => {
    const tokens = createThemeTokens('dark');
    expect(tokens.accent).toBe('neutral');
    expect(tokens.color['color.accent.default']).toBe(
      createThemeTokens('dark', 'neutral').color['color.accent.default'],
    );
  });

  it('changes only the accent family when the accent changes', () => {
    for (const scheme of ['light', 'dark'] as const) {
      const base = createThemeTokens(scheme, 'neutral').color;

      for (const accent of ACCENT_KEYS) {
        const next = createThemeTokens(scheme, accent).color;
        for (const token of Object.keys(base) as (keyof typeof base)[]) {
          if (token.startsWith('color.accent.')) {
            continue;
          }
          expect(next[token]).toBe(base[token]);
        }
      }
    }
  });

  it('gives every accent a distinct default in both schemes', () => {
    for (const scheme of ['light', 'dark'] as const) {
      const defaults = ACCENT_KEYS.map(
        (accent) => createThemeTokens(scheme, accent).color['color.accent.default'],
      );
      expect(new Set(defaults).size).toBe(ACCENT_KEYS.length);
    }
  });

  it('labels every accent key', () => {
    for (const accent of ACCENT_KEYS) {
      expect(ACCENT_LABELS[accent].length).toBeGreaterThan(0);
    }
  });

  it('keeps light and dark accent values different', () => {
    for (const accent of ACCENT_KEYS) {
      expect(createThemeTokens('light', accent).color['color.accent.default']).not.toBe(
        createThemeTokens('dark', accent).color['color.accent.default'],
      );
    }
  });
});

describe('rarity tokens', () => {
  it('resolves a distinct colour per tier in both schemes', () => {
    for (const scheme of ['light', 'dark'] as const) {
      const colors = RARITY_TIERS.map(
        (tier) => createThemeTokens(scheme).color[`color.rarity.${tier}`],
      );
      expect(new Set(colors).size).toBe(RARITY_TIERS.length);
    }
  });

  it('remaps rarity between light and dark', () => {
    for (const tier of RARITY_TIERS) {
      expect(createThemeTokens('light').color[`color.rarity.${tier}`]).not.toBe(
        createThemeTokens('dark').color[`color.rarity.${tier}`],
      );
    }
  });

  it('labels every tier', () => {
    for (const tier of RARITY_TIERS) {
      expect(RARITY_LABELS[tier].length).toBeGreaterThan(0);
    }
  });
});

describe('scrim tokens', () => {
  it('provides a stronger and a softer scrim in both schemes', () => {
    for (const scheme of ['light', 'dark'] as const) {
      const colors = createThemeTokens(scheme).color;
      expect(colors['color.scrim.strong']).not.toBe(colors['color.scrim.soft']);
    }
  });
});
