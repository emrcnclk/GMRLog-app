import { describe, expect, it } from 'vitest';

import {
  countPopulatedFields,
  foldProviderResults,
  hasCoreFields,
  mergeProviderMetadata,
} from './metadata-merge';
import { emptyProviderMetadata } from './providers/metadata-provider.port';
import { completeProviderMetadata } from './testing/fake-providers';

function steamResult(
  overrides: Partial<ReturnType<typeof emptyProviderMetadata>> = {},
): ReturnType<typeof emptyProviderMetadata> {
  return { ...emptyProviderMetadata('steam', 'Steam'), confidence: 1, ...overrides };
}

describe('mergeProviderMetadata', () => {
  it('keeps the primary provider identity and confidence', () => {
    const primary = completeProviderMetadata();
    const merged = mergeProviderMetadata(primary, steamResult({ title: 'Different' }));

    expect(merged.provider).toBe('igdb');
    expect(merged.confidence).toBe(primary.confidence);
    expect(merged.attribution).toBe(primary.attribution);
  });

  it('never overwrites a populated primary scalar', () => {
    const primary = completeProviderMetadata({ summary: 'primary summary' });
    const merged = mergeProviderMetadata(primary, steamResult({ summary: 'steam summary' }));

    expect(merged.summary).toBe('primary summary');
  });

  it('fills a null primary scalar from the secondary', () => {
    const primary = completeProviderMetadata({ summary: null, trailerUrl: null });
    const merged = mergeProviderMetadata(
      primary,
      steamResult({ summary: 'steam summary', trailerUrl: 'https://v/t.mp4' }),
    );

    expect(merged.summary).toBe('steam summary');
    expect(merged.trailerUrl).toBe('https://v/t.mp4');
  });

  it('treats a whitespace-only primary value as absent', () => {
    const primary = completeProviderMetadata({ summary: '   ' });
    const merged = mergeProviderMetadata(primary, steamResult({ summary: 'steam summary' }));

    expect(merged.summary).toBe('steam summary');
  });

  it('unions external ids in both directions', () => {
    const primary = completeProviderMetadata({ externalIds: { igdbId: 1905 } });
    const merged = mergeProviderMetadata(
      primary,
      steamResult({ externalIds: { steamAppId: 1145360 } }),
    );

    expect(merged.externalIds).toEqual({ igdbId: 1905, steamAppId: 1145360, rawgId: null });
  });

  it('does NOT interleave collections when the primary already has them', () => {
    const primary = completeProviderMetadata();
    const merged = mergeProviderMetadata(
      primary,
      steamResult({ genres: [{ name: 'Steam Genre', slug: 'steam-genre' }] }),
    );

    expect(merged.genres).toEqual(primary.genres);
    expect(merged.genres.map((genre) => genre.slug)).not.toContain('steam-genre');
  });

  it('adopts the secondary collection when the primary collection is empty', () => {
    const primary = completeProviderMetadata({ genres: [], media: [] });
    const secondary = steamResult({
      genres: [{ name: 'Action', slug: 'action' }],
      media: [{ kind: 'cover', url: 'https://cdn/a.jpg', width: null, height: null, sortOrder: 0 }],
    });

    const merged = mergeProviderMetadata(primary, secondary);

    expect(merged.genres.map((genre) => genre.slug)).toEqual(['action']);
    expect(merged.media).toHaveLength(1);
  });

  it('moves rating and its sample size together', () => {
    const primary = completeProviderMetadata({ externalRating: null, externalRatingCount: null });
    const merged = mergeProviderMetadata(
      primary,
      steamResult({ externalRating: 78, externalRatingCount: 42 }),
    );

    expect(merged.externalRating).toBe(78);
    expect(merged.externalRatingCount).toBe(42);
  });

  it('does not take the secondary rating count when the primary has a rating', () => {
    const primary = completeProviderMetadata({ externalRating: 91.5, externalRatingCount: null });
    const merged = mergeProviderMetadata(
      primary,
      steamResult({ externalRating: 78, externalRatingCount: 42 }),
    );

    expect(merged.externalRating).toBe(91.5);
    expect(merged.externalRatingCount).toBeNull();
  });

  it('leaves the primary unmutated', () => {
    const primary = completeProviderMetadata({ summary: null });
    const snapshot = JSON.stringify(primary);

    mergeProviderMetadata(primary, steamResult({ summary: 'steam' }));

    expect(JSON.stringify(primary)).toBe(snapshot);
  });
});

describe('foldProviderResults', () => {
  it('returns null for an empty chain', () => {
    expect(foldProviderResults([])).toBeNull();
  });

  it('returns the single result unchanged', () => {
    const only = completeProviderMetadata();
    expect(foldProviderResults([only])).toEqual(only);
  });

  it('folds later providers into the first', () => {
    const primary = completeProviderMetadata({ summary: null, externalIds: { igdbId: 1905 } });
    const secondary = steamResult({
      summary: 'from steam',
      externalIds: { steamAppId: 1145360 },
    });

    const folded = foldProviderResults([primary, secondary]);

    expect(folded?.provider).toBe('igdb');
    expect(folded?.summary).toBe('from steam');
    expect(folded?.externalIds.steamAppId).toBe(1145360);
  });
});

describe('hasCoreFields', () => {
  it('accepts a record with text, taxonomy and artwork', () => {
    expect(hasCoreFields(completeProviderMetadata())).toBe(true);
  });

  it('rejects a record with no descriptive text', () => {
    expect(hasCoreFields(completeProviderMetadata({ summary: null, description: null }))).toBe(
      false,
    );
  });

  it('rejects a record with no genres', () => {
    expect(hasCoreFields(completeProviderMetadata({ genres: [] }))).toBe(false);
  });

  it('rejects a record with no artwork', () => {
    expect(hasCoreFields(completeProviderMetadata({ media: [] }))).toBe(false);
  });
});

describe('countPopulatedFields', () => {
  it('counts zero for an empty record', () => {
    expect(countPopulatedFields(emptyProviderMetadata('igdb', 'x'))).toBe(0);
  });

  it('counts scalars and non-empty collections', () => {
    expect(countPopulatedFields(completeProviderMetadata())).toBeGreaterThan(10);
  });

  it('drops as fields are removed', () => {
    const full = countPopulatedFields(completeProviderMetadata());
    const fewer = countPopulatedFields(completeProviderMetadata({ tags: [], summary: null }));
    expect(fewer).toBe(full - 2);
  });
});
