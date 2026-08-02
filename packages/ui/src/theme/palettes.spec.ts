import { describe, expect, it } from 'vitest';

import { createThemeTokens } from './palettes';

describe('createThemeTokens', () => {
  it('remaps values under the same semantic names for light and dark', () => {
    const light = createThemeTokens('light');
    const dark = createThemeTokens('dark');
    expect(light.scheme).toBe('light');
    expect(dark.scheme).toBe('dark');
    expect(Object.keys(light.color)).toEqual(Object.keys(dark.color));
    expect(light.color['color.text.primary']).not.toBe(dark.color['color.text.primary']);
    expect(light.space['space.2']).toBe(8);
  });

  it('shares radius, elevation, and typography across schemes', () => {
    const light = createThemeTokens('light');
    const dark = createThemeTokens('dark');

    expect(light.radius).toEqual(dark.radius);
    expect(light.elevation).toEqual(dark.elevation);
    expect(light.typography).toEqual(dark.typography);

    // THEME_MIGRATION.md §5: the card band is 11–14, plates stay square-ish at
    // `sm`, and `full` stays 9999 rather than the doc's 999.
    expect(light.radius['radius.sm']).toBe(4);
    expect(light.radius['radius.md']).toBe(8);
    expect(light.radius['radius.lg']).toBe(11);
    expect(light.radius['radius.xl']).toBe(14);
    expect(light.radius['radius.2xl']).toBe(18);
    expect(light.radius['radius.full']).toBe(9999);
    expect(light.elevation['shadow.md'].elevation).toBe(3);
    expect(light.typography.body.fontSize).toBe(15);
    expect(light.typography.headline.fontWeight).toBe('500');
  });

  /**
   * The ramp is the whole point of the typography migration: hierarchy comes
   * from size, colour and space, never from weight. Nothing above 500 may
   * reappear, and every role must carry a family so Android resolves a weight.
   */
  it('keeps every type role within the 300-500 weight band', () => {
    const { typography } = createThemeTokens('dark');

    for (const style of Object.values(typography)) {
      expect(Number(style.fontWeight)).toBeLessThanOrEqual(500);
      expect(Number(style.fontWeight)).toBeGreaterThanOrEqual(200);
      expect(style.fontFamily).toBeDefined();
    }
  });

  /** Only the two metadata roles are monospace, and both are uppercase. */
  it('sets the mono family and uppercase on exactly the meta roles', () => {
    const { typography } = createThemeTokens('dark');

    const mono = Object.entries(typography)
      .filter(([, style]) => style.fontFamily === 'IBMPlexMono-Regular')
      .map(([role]) => role)
      .sort();

    expect(mono).toEqual(['meta', 'metaSm']);
    expect(typography.meta.textTransform).toBe('uppercase');
    expect(typography.metaSm.textTransform).toBe('uppercase');
    expect(typography.body.textTransform).toBeUndefined();
  });

  /**
   * The three deprecated aliases must stay identical to their ramp targets, so
   * a screen still on the old name renders exactly what the new name gives.
   * Delete this test with the aliases when Phase 3b lands.
   */
  it('keeps the deprecated role aliases pinned to their ramp targets', () => {
    const { typography } = createThemeTokens('dark');

    expect(typography.heading).toEqual(typography.title2);
    expect(typography.title).toEqual(typography.headline);
    expect(typography.caption).toEqual(typography.bodySm);
  });

  /**
   * D3.28. A scrim is dark in both schemes, so its foreground must not flip with
   * the scheme the way `color.text.inverse` does — that flip renders a near-black
   * glyph on a near-black scrim in dark mode. This test is the guard: if someone
   * later "fixes" the foreground to follow the scheme, the hero back button and
   * every label over artwork go invisible in dark mode, and this fails first.
   */
  it('keeps the scrim foreground constant across schemes', () => {
    const light = createThemeTokens('light');
    const dark = createThemeTokens('dark');

    expect(light.color['color.scrim.foreground']).toBe(dark.color['color.scrim.foreground']);

    // The contrast with `text.inverse`, which is exactly what makes it unusable here.
    expect(light.color['color.text.inverse']).not.toBe(dark.color['color.text.inverse']);
  });
});
