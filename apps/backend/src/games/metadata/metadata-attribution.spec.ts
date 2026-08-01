import { describe, expect, it } from 'vitest';

import { providerAttribution } from './metadata-attribution';
import { IGDB_ATTRIBUTION } from './providers/igdb.provider';
import { RAWG_ATTRIBUTION } from './providers/rawg.provider';
import { STEAM_ATTRIBUTION } from './providers/steam-store.provider';

/** docs/18_CATALOG/METADATA_LICENSING.md §2 — one attribution string per provider. */
describe('providerAttribution', () => {
  it('returns the correct attribution string per provider', () => {
    expect(providerAttribution('igdb')).toBe(IGDB_ATTRIBUTION);
    expect(providerAttribution('steam')).toBe(STEAM_ATTRIBUTION);
    expect(providerAttribution('rawg')).toBe(RAWG_ATTRIBUTION);
  });

  it('returns null for a manual or absent provider', () => {
    expect(providerAttribution('manual')).toBeNull();
    expect(providerAttribution(null)).toBeNull();
  });
});
