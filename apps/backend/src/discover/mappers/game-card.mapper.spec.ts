import type { DiscoverGameRecord } from '@gmrlog/database';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { GAME_CATALOG_DEFAULTS } from '../../games/game-catalog.defaults';

import { resolveCoverImageUrl, toGameCardResponse } from './game-card.mapper';

const BASE_URL = 'https://cdn.test.local/';
let previousBaseUrl: string | undefined;

beforeEach(() => {
  previousBaseUrl = process.env.MEDIA_PUBLIC_BASE_URL;
  process.env.MEDIA_PUBLIC_BASE_URL = BASE_URL;
});

afterEach(() => {
  if (previousBaseUrl === undefined) {
    delete process.env.MEDIA_PUBLIC_BASE_URL;
  } else {
    process.env.MEDIA_PUBLIC_BASE_URL = previousBaseUrl;
  }
});

function makeRecord(overrides: Partial<DiscoverGameRecord['game']> = {}): DiscoverGameRecord {
  return {
    game: {
      id: 'game-1',
      title: 'Hollow Knight',
      slug: 'hollow-knight',
      coverKey: null,
      releaseDate: new Date('2017-02-24T00:00:00.000Z'),
      featured: false,
      popularity: 10,
      franchiseId: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      ...GAME_CATALOG_DEFAULTS,
      ...overrides,
    },
    genres: [],
    platforms: [],
    ratingAverage: null,
    ratingCount: 0,
    libraryCount: 0,
  } as DiscoverGameRecord;
}

/**
 * Before D3.25 this returned a hardcoded `null` because nothing populated
 * `coverKey` (SPRINT_0_PROJECT_AUDIT.md C3). Catalog media ingestion now
 * writes it, so a real URL must come out.
 */
describe('resolveCoverImageUrl', () => {
  it('resolves a stored key to a public URL', () => {
    expect(resolveCoverImageUrl('games/game-1/cover/abc.jpg')).toBe(
      `${BASE_URL}games%2Fgame-1%2Fcover%2Fabc.jpg`,
    );
  });

  it('is null only when there is genuinely no cover', () => {
    expect(resolveCoverImageUrl(null)).toBeNull();
    expect(resolveCoverImageUrl('')).toBeNull();
  });
});

describe('toGameCardResponse', () => {
  it('returns a real cover URL once the catalog has ingested one', () => {
    const card = toGameCardResponse(makeRecord({ coverKey: 'games/game-1/cover/abc.jpg' }));
    expect(card.coverImageUrl).toBe(`${BASE_URL}games%2Fgame-1%2Fcover%2Fabc.jpg`);
  });

  it('projects the D3.25 hero image and summary', () => {
    const card = toGameCardResponse(
      makeRecord({ heroKey: 'games/game-1/hero/def.jpg', summary: 'A haunting metroidvania.' }),
    );

    expect(card.heroImageUrl).toBe(`${BASE_URL}games%2Fgame-1%2Fhero%2Fdef.jpg`);
    expect(card.summary).toBe('A haunting metroidvania.');
  });

  it('degrades cleanly for an un-enriched game', () => {
    const card = toGameCardResponse(makeRecord());

    expect(card.coverImageUrl).toBeNull();
    expect(card.heroImageUrl).toBeNull();
    expect(card.summary).toBeNull();
    expect(card.title).toBe('Hollow Knight');
  });

  it('serialises the release date as ISO', () => {
    const card = toGameCardResponse(makeRecord());
    expect(card.releaseDate).toBe('2017-02-24T00:00:00.000Z');
  });
});
