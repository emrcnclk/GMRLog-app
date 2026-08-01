import { describe, expect, it } from 'vitest';

import {
  absoluteImageUrl,
  clampText,
  dedupeBySlug,
  foldTitle,
  normalizeRating,
  normalizeTitle,
  parseReleaseYear,
  slugifyRef,
  stripHtml,
  titleTokens,
} from './metadata-normalize';

describe('foldTitle', () => {
  it('lowercases, de-accents and collapses punctuation', () => {
    expect(foldTitle('  Pokémon: Let’s Go!  ')).toBe('pokemon let s go');
  });

  it('returns an empty string for punctuation-only input', () => {
    expect(foldTitle('!!! ---')).toBe('');
  });
});

describe('normalizeTitle', () => {
  it('strips edition suffixes so editions converge on the base title', () => {
    expect(normalizeTitle('The Witcher 3: Wild Hunt - Game of the Year Edition')).toBe(
      'the witcher 3 wild hunt',
    );
    expect(normalizeTitle('Skyrim Special Edition')).toBe('skyrim');
  });

  it('converts roman numerals so VII and 7 match', () => {
    expect(normalizeTitle('Final Fantasy VII')).toBe(normalizeTitle('Final Fantasy 7'));
  });

  it('leaves an already-canonical title untouched', () => {
    expect(normalizeTitle('Hades')).toBe('hades');
  });
});

describe('titleTokens', () => {
  it('splits into a token set', () => {
    expect(titleTokens('Hollow Knight')).toEqual(new Set(['hollow', 'knight']));
  });

  it('returns an empty set for empty input', () => {
    expect(titleTokens('***')).toEqual(new Set());
  });
});

describe('slugifyRef', () => {
  it('produces a stable slug', () => {
    expect(slugifyRef('Role-playing (RPG)')).toBe('role-playing-rpg');
  });

  it('falls back to "unknown" rather than an empty slug', () => {
    expect(slugifyRef('///')).toBe('unknown');
  });
});

describe('stripHtml', () => {
  it('removes tags and decodes the entities Steam emits', () => {
    expect(stripHtml('<p>Hack &amp; slash<br/>out of hell</p>')).toBe('Hack & slash\nout of hell');
  });
});

describe('clampText', () => {
  it('returns null for empty or whitespace-only input', () => {
    expect(clampText('   ', 100)).toBeNull();
    expect(clampText(null, 100)).toBeNull();
  });

  it('passes short text through unchanged', () => {
    expect(clampText('short', 100)).toBe('short');
  });

  it('cuts at a word boundary when one is close to the ceiling', () => {
    // Ceiling 20 → cut at "aaaa bbbb cccc dddd "; the space at 19 is past
    // 0.8 × 20, so the boundary wins.
    const clamped = clampText('aaaa bbbb cccc dddd eeee', 20);
    expect(clamped).toBe('aaaa bbbb cccc dddd');
    expect((clamped ?? '').length).toBeLessThanOrEqual(20);
  });

  it('hard-cuts when the nearest boundary is too far back', () => {
    // Ceiling 18 → last space at 14, below 0.8 × 18, so cutting there would
    // waste too much text.
    expect(clampText('aaaa bbbb cccc dddd eeee', 18)).toBe('aaaa bbbb cccc ddd');
    expect(clampText('abcdefghijklmnop', 5)).toBe('abcde');
  });
});

describe('normalizeRating', () => {
  it('rescales to 0-100', () => {
    expect(normalizeRating(4, 5)).toBe(80);
    expect(normalizeRating(91.5, 100)).toBe(91.5);
  });

  it('clamps out-of-range values', () => {
    expect(normalizeRating(-3, 100)).toBe(0);
    expect(normalizeRating(250, 100)).toBe(100);
  });

  it('returns null for missing or nonsensical input', () => {
    expect(normalizeRating(null, 100)).toBeNull();
    expect(normalizeRating(undefined, 100)).toBeNull();
    expect(normalizeRating(Number.NaN, 100)).toBeNull();
    expect(normalizeRating(5, 0)).toBeNull();
  });
});

describe('absoluteImageUrl', () => {
  it('upgrades protocol-relative and http URLs to https', () => {
    expect(absoluteImageUrl('//images.igdb.com/a.jpg')).toBe('https://images.igdb.com/a.jpg');
    expect(absoluteImageUrl('http://cdn.example/a.png')).toBe('https://cdn.example/a.png');
  });

  it('rejects anything that is not an absolute web URL', () => {
    expect(absoluteImageUrl('a.jpg')).toBeNull();
    expect(absoluteImageUrl('   ')).toBeNull();
    expect(absoluteImageUrl('javascript:alert(1)')).toBeNull();
  });
});

describe('parseReleaseYear', () => {
  it('extracts the UTC year', () => {
    expect(parseReleaseYear(new Date('2020-09-17T00:00:00.000Z'))).toBe(2020);
  });

  it('returns null for null or invalid dates', () => {
    expect(parseReleaseYear(null)).toBeNull();
    expect(parseReleaseYear(new Date('nope'))).toBeNull();
  });
});

describe('dedupeBySlug', () => {
  it('keeps first-seen order and drops duplicates and empties', () => {
    const result = dedupeBySlug([
      { slug: 'a', name: 'A' },
      { slug: 'b', name: 'B' },
      { slug: 'a', name: 'A again' },
      { slug: '', name: 'empty' },
    ]);
    expect(result.map((row) => row.slug)).toEqual(['a', 'b']);
  });
});
