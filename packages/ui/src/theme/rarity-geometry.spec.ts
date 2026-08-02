import { describe, expect, it } from 'vitest';

import { RARITY_PLATE_MIN, RARITY_TIERS, createThemeTokens, rarityGeometry } from './palettes';

const tokens = createThemeTokens('dark');

const radii = RARITY_TIERS.map((tier) => tokens.radius[rarityGeometry(tier).radius]);
const glows = RARITY_TIERS.map((tier) => tokens.elevation[rarityGeometry(tier).elevation]);
const notches = RARITY_TIERS.map((tier) => tokens.space[rarityGeometry(tier).notch]);

describe('rarity geometry', () => {
  it('pins the endpoints THEME_MIGRATION.md §5 names', () => {
    expect(rarityGeometry('common')).toMatchObject({
      radius: 'radius.full',
      elevation: 'shadow.none',
    });
    expect(rarityGeometry('legendary')).toMatchObject({
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

  it('resolves every radius step on a plate of RARITY_PLATE_MIN', () => {
    // RN clamps borderRadius to half the box, so a step only reads if it fits.
    const half = RARITY_PLATE_MIN / 2;
    const resolved = radii.filter((radius) => radius <= half);

    // Only `full` is allowed to clamp — common is meant to be a circle.
    expect(resolved).toHaveLength(RARITY_TIERS.length - 1);
    expect(radii[0]).toBeGreaterThan(half);
  });

  it('lengthens the notch as the tier climbs, for slots below plate size', () => {
    for (let i = 1; i < notches.length; i += 1) {
      expect(notches[i]).toBeGreaterThanOrEqual(notches[i - 1]);
    }
    expect(notches[notches.length - 1]).toBeGreaterThan(notches[0]);
  });

  it('separates every tier on notch and glow alone — the small-slot fallback', () => {
    const fallback = RARITY_TIERS.map((tier) => {
      const { notch, elevation } = rarityGeometry(tier);
      return `${tokens.space[notch]}/${tokens.elevation[elevation].shadowRadius}`;
    });

    expect(new Set(fallback).size).toBe(RARITY_TIERS.length);
  });
});
