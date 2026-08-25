import { describe, expect, it } from 'vitest';

import {
  ABOUT_LINKS,
  aboutCopyright,
  aboutSignedInLine,
  aboutVersionLine,
} from '../model/about-model';

describe('settings about', () => {
  it('lists privacy terms disclosure oss contact', () => {
    expect(ABOUT_LINKS.map((l) => l.id)).toEqual([
      'privacy',
      'terms',
      'disclosure',
      'oss',
      'contact',
    ]);
  });

  it('marks oss as placeholder with no target', () => {
    const oss = ABOUT_LINKS.find((l) => l.id === 'oss');
    expect(oss?.placeholder).toBe(true);
    expect(oss?.target.kind).toBe('none');
  });

  it('sends the three legal rows to in-app routes, not gmrlog.com', () => {
    // The defect that opened Phase 12: these were external URLs to a host
    // nothing in this repo serves, so About opened a browser at a 404.
    for (const id of ['privacy', 'terms', 'disclosure']) {
      const row = ABOUT_LINKS.find((l) => l.id === id);
      expect(row?.target.kind).toBe('route');
      expect(row?.target.kind === 'route' && row.target.path).toMatch(/^\/legal\//);
    }
  });

  it('leaves contact as the only row that leaves the app', () => {
    const external = ABOUT_LINKS.filter((l) => l.target.kind === 'external');
    expect(external.map((l) => l.id)).toEqual(['contact']);
    expect(external[0]?.target.kind === 'external' && external[0].target.url).toContain('mailto:');
  });

  it('no row points at gmrlog.com any more', () => {
    const serialised = JSON.stringify(ABOUT_LINKS);
    expect(serialised).not.toContain('gmrlog.com/privacy');
    expect(serialised).not.toContain('gmrlog.com/terms');
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
