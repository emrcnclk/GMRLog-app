import type { AccentKey } from '@gmrlog/ui';
import { describe, expect, it } from 'vitest';

import {
  buildCosmeticCatalog,
  COSMETIC_CATEGORIES,
  COSMETIC_CATEGORY_LABELS,
  filterCatalogByCategory,
} from './cosmetics-store-model';

// A small local fixture, not `@gmrlog/ui`'s real `ACCENT_KEYS`/`ACCENT_LABELS`:
// importing that package's runtime exports here would pull its whole React
// Native component barrel into this pure-model test. `packages/ui/src/theme/
// accent.spec.ts` already covers the real accent list; this file tests the
// catalog-building/filtering mechanics in isolation.
const FIXTURE_ACCENT_KEYS: readonly AccentKey[] = ['neutral', 'ember', 'plasma'];
const FIXTURE_ACCENT_LABELS: Record<AccentKey, string> = {
  neutral: 'Neutral',
  ember: 'Ember',
  plasma: 'Plasma',
  toxic: 'Toxic',
  cobalt: 'Cobalt',
  magma: 'Magma',
  orchid: 'Orchid',
  gold: 'Gold',
};

describe('cosmetics-store-model', () => {
  it('builds one entry per accent key and every card style and banner style', () => {
    const catalog = buildCosmeticCatalog(FIXTURE_ACCENT_KEYS, FIXTURE_ACCENT_LABELS);

    expect(catalog.filter((item) => item.category === 'accent')).toHaveLength(3);
    expect(catalog.filter((item) => item.category === 'cardStyle')).toHaveLength(3);
    expect(catalog.filter((item) => item.category === 'bannerStyle')).toHaveLength(3);
  });

  it('gives every catalog item a non-empty name and a unique id within its category', () => {
    const catalog = buildCosmeticCatalog(FIXTURE_ACCENT_KEYS, FIXTURE_ACCENT_LABELS);

    for (const category of COSMETIC_CATEGORIES) {
      const ids = catalog.filter((item) => item.category === category).map((item) => item.id);
      expect(new Set(ids).size).toBe(ids.length);
    }

    for (const item of catalog) {
      expect(item.name.length).toBeGreaterThan(0);
    }
  });

  it('has a label for every category', () => {
    for (const category of COSMETIC_CATEGORIES) {
      expect(COSMETIC_CATEGORY_LABELS[category].length).toBeGreaterThan(0);
    }
  });

  it('filters the catalog down to one category', () => {
    const catalog = buildCosmeticCatalog(FIXTURE_ACCENT_KEYS, FIXTURE_ACCENT_LABELS);

    const accents = filterCatalogByCategory(catalog, 'accent');
    expect(accents.every((item) => item.category === 'accent')).toBe(true);
    expect(accents).toHaveLength(3);
  });
});
