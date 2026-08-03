import { describe, expect, it } from 'vitest';

import { createThemeTokens, scrimRgbTriple } from './palettes';

describe('scrimRgbTriple', () => {
  it('strips the alpha channel from an rgba() token', () => {
    expect(scrimRgbTriple('rgba(22,24,42,0.82)')).toBe('22,24,42');
  });

  it('passes through an rgb() token with no alpha to strip', () => {
    expect(scrimRgbTriple('rgb(22,24,42)')).toBe('22,24,42');
  });

  it('tolerates whitespace between channels', () => {
    expect(scrimRgbTriple('rgba(22, 24, 42, 0.82)')).toBe('22,24,42');
  });

  it('falls back to black for a value it cannot parse', () => {
    expect(scrimRgbTriple('#161826')).toBe('0,0,0');
  });

  it('resolves to a real, distinct triple per scheme off the live tokens', () => {
    const light = scrimRgbTriple(createThemeTokens('light').color['color.scrim.strong']);
    const dark = scrimRgbTriple(createThemeTokens('dark').color['color.scrim.strong']);

    expect(light).toBe('22,24,42');
    expect(dark).toBe('22,24,38');
    expect(light).not.toBe(dark);
  });
});
