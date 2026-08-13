import { describe, expect, it } from 'vitest';

import { buildDnaVerdict, DNA_THIN_DATA_VERDICT } from './dna-verdict';

describe('buildDnaVerdict', () => {
  it('names the weakest signal first, then the strongest', () => {
    const verdict = buildDnaVerdict({
      library: 0.1,
      genre: 0.4,
      reviewRating: 0.9,
      wishlist: 0.3,
      completion: 0.2,
    });
    expect(verdict).toBe(
      'Smaller shared shelf, but you agree on almost everything you have both played.',
    );
  });

  it('picks a different pair when a different dimension leads', () => {
    const verdict = buildDnaVerdict({
      library: 0.9,
      genre: 0.1,
      reviewRating: 0.5,
      wishlist: 0.5,
      completion: 0.5,
    });
    expect(verdict).toBe('Different genre instincts, but your shared library is unusually large.');
  });

  it('falls back to a generic sentence when every dimension ties', () => {
    const verdict = buildDnaVerdict({
      library: 0.5,
      genre: 0.5,
      reviewRating: 0.5,
      wishlist: 0.5,
      completion: 0.5,
    });
    expect(verdict).toBe(
      'Your play patterns line up evenly across the board — no single signal stands out yet.',
    );
  });

  it('ties at zero also fall back to the generic sentence, never the thin-data copy', () => {
    const verdict = buildDnaVerdict({
      library: 0,
      genre: 0,
      reviewRating: 0,
      wishlist: 0,
      completion: 0,
    });
    expect(verdict).not.toBe(DNA_THIN_DATA_VERDICT);
  });
});
