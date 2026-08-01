import type { GameCardResponse } from '@gmrlog/types';
import { describe, expect, it } from 'vitest';

describe('GameCard content contract', () => {
  it('builds accessible rating + genre summary fields', () => {
    const game: GameCardResponse = {
      id: 'g1',
      slug: 'hollow-knight',
      title: 'Hollow Knight',
      coverImageUrl: null,
      coverImage: null,
      heroImageUrl: null,
      heroImage: null,
      summary: null,
      releaseDate: null,
      genres: [
        { id: '1', name: 'Metroidvania', slug: 'metroidvania' },
        { id: '2', name: 'Action', slug: 'action' },
      ],
      platforms: [],
      ratingSummary: { average: 4.8, count: 120 },
      libraryCount: 50,
    };

    const genreLabel = game.genres
      .slice(0, 2)
      .map((g) => g.name)
      .join(' · ');
    const ratingLabel =
      game.ratingSummary.average !== null
        ? `${game.ratingSummary.average.toFixed(1)} · ${String(game.ratingSummary.count)} reviews`
        : `${String(game.ratingSummary.count)} reviews`;

    expect(genreLabel).toBe('Metroidvania · Action');
    expect(ratingLabel).toContain('4.8');
    expect(`${game.title}. ${genreLabel}. ${ratingLabel}`).toContain('Hollow Knight');
  });
});
