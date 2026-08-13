import type { PlayerArchetypeResponse } from '@gmrlog/types';

import { archetypeLabel } from '../../archetypes/mappers/archetype.mapper';

/**
 * 5.5 (`BACKEND_CHANGES.md` §4, "Traits") — `DnaMatchResponse.traits` derived
 * from `ArchetypeEngineService.listForUser`'s own output for both sides of
 * the pair. No second taxonomy: the only vocabulary here is
 * `PlayerArchetypeKey`, the engine's own; this file only decides which of
 * the *shared* badges to show and adapts them to `string[]` via the mapper's
 * `archetypeLabel`.
 *
 * Traits describe the PAIR, not one player — only archetypes awarded to
 * *both* the viewer and the subject qualify, ranked by the combined score
 * (the two engine scores that badge earned, summed) so the strongest shared
 * trait leads. Ties break on the key itself for a stable order. Capped at 3;
 * fewer — including zero — is left as-is, never padded.
 */
const MAX_TRAITS = 3;

export function buildDnaTraits(
  viewer: readonly PlayerArchetypeResponse[],
  target: readonly PlayerArchetypeResponse[],
): string[] {
  const viewerScoreByKey = new Map(viewer.map((row) => [row.key, row.score]));

  const shared = target.flatMap((row) => {
    const viewerScore = viewerScoreByKey.get(row.key);
    if (viewerScore === undefined) {
      return [];
    }
    return [{ key: row.key, combinedScore: viewerScore + row.score }];
  });

  shared.sort((a, b) => b.combinedScore - a.combinedScore || a.key.localeCompare(b.key));

  return shared.slice(0, MAX_TRAITS).map((row) => archetypeLabel(row.key));
}
