import { describe, expect, it } from 'vitest';

import { RARITY_TIERS, createThemeTokens, rarityGeometry } from './palettes';

const tokens = createThemeTokens('dark');

const radii = RARITY_TIERS.map((tier) => tokens.radius[rarityGeometry(tier).radius]);
const glows = RARITY_TIERS.map((tier) => tokens.elevation[rarityGeometry(tier).elevation]);

describe('rarity geometry', () => {
  it('pins the endpoints THEME_MIGRATION.md §5 names', () => {
    expect(rarityGeometry('common')).toEqual({
      radius: 'radius.full',
      elevation: 'shadow.none',
    });
    expect(rarityGeometry('legendary')).toEqual({
      radius: 'radius.sm',
      elevation: 'shadow.md',
    });
  });

  it('sharpens the corners as the tier climbs', () => {
    for (let i = 1; i < radii.length; i += 1) {
      expect(radii[i]).toBeLessThanOrEqual(radii[i - 1]);
    }
    expect(radii[radii.length - 1]).toBeLessThan(radii[0]);
  });

  it('raises the glow monotonically, and only at the top tiers', () => {
    for (let i = 1; i < glows.length; i += 1) {
      expect(glows[i].shadowRadius).toBeGreaterThanOrEqual(glows[i - 1].shadowRadius);
    }
    expect(glows[0].shadowRadius).toBe(0);
    expect(glows[glows.length - 1].shadowRadius).toBeGreaterThan(0);
  });

  it('keeps rank readable without colour — every tier is a distinct shape pair', () => {
    const shapes = RARITY_TIERS.map((tier) => {
      const { radius, elevation } = rarityGeometry(tier);
      return `${tokens.radius[radius]}/${tokens.elevation[elevation].shadowRadius}`;
    });

    expect(new Set(shapes).size).toBe(RARITY_TIERS.length);
  });
});
