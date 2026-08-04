import { describe, expect, it } from 'vitest';

import {
  ABOUT_LINKS,
  aboutCopyright,
  aboutSignedInLine,
  aboutVersionLine,
} from '../model/about-model';

describe('settings about', () => {
  it('lists privacy terms oss contact', () => {
    expect(ABOUT_LINKS.map((l) => l.id)).toEqual(['privacy', 'terms', 'oss', 'contact']);
  });

  it('marks oss as placeholder without href', () => {
    const oss = ABOUT_LINKS.find((l) => l.id === 'oss');
    expect(oss?.placeholder).toBe(true);
    expect(oss?.href).toBeNull();
  });

  it('provides actionable legal links', () => {
    expect(ABOUT_LINKS.find((l) => l.id === 'privacy')?.href).toContain('privacy');
    expect(ABOUT_LINKS.find((l) => l.id === 'terms')?.href).toContain('terms');
    expect(ABOUT_LINKS.find((l) => l.id === 'contact')?.href).toContain('mailto:');
  });

  it('formats version and copyright', () => {
    expect(aboutVersionLine('0.0.0', '12')).toBe('GMRLOG 0.0.0 (12)');
    expect(aboutCopyright(2026)).toContain('2026');
    expect(aboutCopyright(2026)).toContain('GMRLOG');
  });

  it('formats the signed-in handle line', () => {
    expect(aboutSignedInLine('measure3_2')).toBe('Signed in as @measure3_2');
  });
});
