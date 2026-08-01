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

    expect(light.radius['radius.md']).toBe(8);
    expect(light.radius['radius.full']).toBe(9999);
    expect(light.elevation['shadow.md'].elevation).toBe(3);
    expect(light.typography.body.fontSize).toBe(16);
    expect(light.typography.title.fontWeight).toBe('600');
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
