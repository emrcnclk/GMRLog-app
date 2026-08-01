import type { MetadataProvider } from '@gmrlog/database';

import { IGDB_ATTRIBUTION } from './providers/igdb.provider';
import { RAWG_ATTRIBUTION } from './providers/rawg.provider';
import { STEAM_ATTRIBUTION } from './providers/steam-store.provider';

/**
 * Attribution strings surfaced on catalog reads (D3.25 —
 * docs/18_CATALOG/METADATA_LICENSING.md §2).
 *
 * The API serves this so the future UI sprint has a contractual place to render
 * it. Nothing renders it yet — D3.25 does not touch UI. Tracked as a
 * carry-forward in the completion report, not claimed as done.
 */
export function providerAttribution(provider: MetadataProvider | null): string | null {
  switch (provider) {
    case 'igdb':
      return IGDB_ATTRIBUTION;
    case 'steam':
      return STEAM_ATTRIBUTION;
    case 'rawg':
      return RAWG_ATTRIBUTION;
    case 'manual':
      return null;
    default:
      return null;
  }
}
