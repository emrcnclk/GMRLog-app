import { describe, expect, it } from 'vitest';

import { pickBestMatch, scoreTitleMatch } from './metadata-match';

describe('scoreTitleMatch', () => {
  it('scores an exact normalized title highest', () => {
    expect(scoreTitleMatch({ title: 'Hades' }, { title: 'hades' })).toBeCloseTo(0.9);
  });

  it('treats an edition suffix as an exact match', () => {
    const score = scoreTitleMatch(
      { title: 'The Witcher 3: Wild Hunt' },
      { title: 'The Witcher 3: Wild Hunt - Game of the Year Edition' },
    );
    expect(score).toBeCloseTo(0.9);
  });

  it('scores a prefix match below an exact match', () => {
    const prefix = scoreTitleMatch({ title: 'Portal' }, { title: 'Portal 2' });
    const exact = scoreTitleMatch({ title: 'Portal' }, { title: 'Portal' });
    expect(prefix).toBeGreaterThan(0);
    expect(prefix).toBeLessThan(exact);
  });

  it('treats "Remastered" as an edition suffix, so it prefix-matches the sequel', () => {
    // "Dark Souls Remastered" normalises to "dark souls", which is a prefix of
    // "dark souls 3" — a prefix match, not a token-overlap match.
    expect(
      scoreTitleMatch({ title: 'Dark Souls Remastered' }, { title: 'Dark Souls III' }),
    ).toBeCloseTo(0.7);
  });

  it('falls back to token overlap when neither exact nor prefix applies', () => {
    const score = scoreTitleMatch({ title: 'Dark Souls' }, { title: 'Souls of Darkness' });
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(0.7);
  });

  it('rewards a matching release year', () => {
    const withYear = scoreTitleMatch(
      { title: 'Hades', releaseYear: 2020 },
      { title: 'Hades', releaseYear: 2020 },
    );
    const withoutYear = scoreTitleMatch({ title: 'Hades' }, { title: 'Hades' });
    expect(withYear).toBeGreaterThan(withoutYear);
  });

  it('penalises a contradicting release year enough to matter', () => {
    const contradicting = scoreTitleMatch(
      { title: 'Hades', releaseYear: 2020 },
      { title: 'Hades', releaseYear: 1995 },
    );
    expect(contradicting).toBeCloseTo(0.65);
    expect(contradicting).toBeLessThan(0.8);
  });

  it('scores zero for unrelated or empty titles', () => {
    expect(scoreTitleMatch({ title: 'Hades' }, { title: 'FIFA' })).toBe(0);
    expect(scoreTitleMatch({ title: '' }, { title: 'Hades' })).toBe(0);
    expect(scoreTitleMatch({ title: 'Hades' }, { title: '' })).toBe(0);
  });

  it('never exceeds 1', () => {
    const score = scoreTitleMatch(
      { title: 'Hades', releaseYear: 2020 },
      { title: 'Hades', releaseYear: 2020 },
    );
    expect(score).toBeLessThanOrEqual(1);
  });
});

describe('pickBestMatch', () => {
  it('returns the highest-scoring candidate', () => {
    const best = pickBestMatch({ title: 'Portal 2' }, [
      { title: 'Portal' },
      { title: 'Portal 2' },
      { title: 'Portal Stories' },
    ]);
    expect(best?.candidate.title).toBe('Portal 2');
  });

  it('uses the release year to break a title tie', () => {
    const best = pickBestMatch({ title: 'Doom', releaseYear: 2016 }, [
      { title: 'Doom', releaseYear: 1993 },
      { title: 'Doom', releaseYear: 2016 },
    ]);
    expect(best?.candidate.releaseYear).toBe(2016);
  });

  it('returns null when nothing scores above zero', () => {
    expect(pickBestMatch({ title: 'Hades' }, [{ title: 'FIFA' }])).toBeNull();
    expect(pickBestMatch({ title: 'Hades' }, [])).toBeNull();
  });
});
