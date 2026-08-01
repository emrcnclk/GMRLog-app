import type { UserArchetype } from '@gmrlog/database';
import type { PlayerArchetypeKey, PlayerArchetypeResponse } from '@gmrlog/types';

export function toPlayerArchetypeResponse(row: UserArchetype): PlayerArchetypeResponse {
  return {
    key: row.archetypeKey as PlayerArchetypeKey,
    score: row.score,
    awardedAt: row.awardedAt.toISOString(),
  };
}
