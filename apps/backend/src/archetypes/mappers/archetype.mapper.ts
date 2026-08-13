import type { UserArchetype } from '@gmrlog/database';
import type { PlayerArchetypeKey, PlayerArchetypeResponse } from '@gmrlog/types';

export function toPlayerArchetypeResponse(row: UserArchetype): PlayerArchetypeResponse {
  return {
    key: row.archetypeKey as PlayerArchetypeKey,
    score: row.score,
    awardedAt: row.awardedAt.toISOString(),
  };
}

/**
 * 5.5 (`design_handoff_dna_match_and_community/BACKEND_CHANGES.md` §4,
 * "Traits") — short display labels for the engine's own `PlayerArchetypeKey`
 * union. Mirrors `apps/frontend/features/profile/hooks/profile-model.ts`'s
 * `ARCHETYPE_LABELS` exactly; duplicated the same way `ProfileAccentValue` is
 * (`packages/types/src/index.ts`) so the backend never depends on the
 * frontend package. Keep both lists in lockstep.
 */
export const ARCHETYPE_LABELS: Record<PlayerArchetypeKey, string> = {
  collector: 'Collector',
  completionist: 'Completionist',
  tryhard: 'Tryhard',
  explorer: 'Explorer',
  reviewer: 'Reviewer',
  speedrunner: 'Speedrunner',
  backlog_hoarder: 'Backlog Hoarder',
  competitive: 'Competitive',
  story_lover: 'Story Lover',
  indie_hunter: 'Indie Hunter',
  achievement_hunter: 'Achievement Hunter',
  social_gamer: 'Social Gamer',
};

export function archetypeLabel(key: PlayerArchetypeKey): string {
  return ARCHETYPE_LABELS[key];
}
