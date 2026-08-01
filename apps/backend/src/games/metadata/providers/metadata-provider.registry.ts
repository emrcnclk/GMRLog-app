/**
 * Provider chain resolution (D3.25 — docs/18_CATALOG/METADATA_PROVIDERS.md §4).
 *
 * Walks enabled providers in priority order. The first result at or above the
 * confidence floor becomes the primary; the rest are consulted only to fill
 * gaps. A provider throwing is recorded and skipped — one broken provider must
 * not deny the catalog a result the others can supply.
 */

import { Inject, Injectable, Optional } from '@nestjs/common';

import { AppLogger } from '../../../infrastructure/logging/app-logger.service';
import { foldProviderResults } from '../metadata-merge';

import {
  GAME_METADATA_PROVIDERS,
  type GameMetadataProvider,
  type ProviderGameMetadata,
  type ProviderLookupQuery,
} from './metadata-provider.port';

export interface ProviderResolution {
  metadata: ProviderGameMetadata | null;
  /** Providers that threw. Surfaced so the caller can distinguish outage from no-match. */
  errors: { provider: string; message: string }[];
  /** True when no provider is configured — a valid zero-credential deployment. */
  noProvidersEnabled: boolean;
}

@Injectable()
export class MetadataProviderRegistry {
  private readonly ordered: GameMetadataProvider[];

  constructor(
    @Inject(GAME_METADATA_PROVIDERS) providers: GameMetadataProvider[],
    @Optional() private readonly logger: AppLogger | null = null,
  ) {
    this.ordered = [...providers].sort((left, right) => left.priority - right.priority);
  }

  enabledProviders(): GameMetadataProvider[] {
    return this.ordered.filter((provider) => provider.isEnabled());
  }

  async resolve(query: ProviderLookupQuery, minConfidence: number): Promise<ProviderResolution> {
    const enabled = this.enabledProviders();
    if (enabled.length === 0) {
      return { metadata: null, errors: [], noProvidersEnabled: true };
    }

    const errors: ProviderResolution['errors'] = [];
    const accepted: ProviderGameMetadata[] = [];
    // External ids learned from earlier providers unlock later ones — IGDB
    // reporting a steamAppId is what lets the Steam provider run at all.
    let workingQuery: ProviderLookupQuery = { ...query };

    for (const provider of enabled) {
      let result: ProviderGameMetadata | null;
      try {
        result = await provider.lookup(workingQuery);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push({ provider: provider.name, message });
        this.logger?.event(
          'warn',
          { provider: provider.name, title: query.title, error: message },
          'game.metadata.provider.failed',
        );
        continue;
      }

      if (result === null || result.confidence < minConfidence) {
        continue;
      }

      accepted.push(result);
      workingQuery = mergeQueryIds(workingQuery, result);
    }

    return {
      metadata: foldProviderResults(accepted),
      errors,
      noProvidersEnabled: false,
    };
  }
}

function mergeQueryIds(
  query: ProviderLookupQuery,
  result: ProviderGameMetadata,
): ProviderLookupQuery {
  return {
    ...query,
    igdbId: query.igdbId ?? result.externalIds.igdbId ?? null,
    steamAppId: query.steamAppId ?? result.externalIds.steamAppId ?? null,
    rawgId: query.rawgId ?? result.externalIds.rawgId ?? null,
  };
}
