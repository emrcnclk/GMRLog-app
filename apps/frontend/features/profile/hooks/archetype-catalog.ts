import type { PlayerArchetypeKey, PlayerArchetypeResponse } from '@gmrlog/types';
import type { RarityTier } from '@gmrlog/ui';

/**
 * D3.27 Phase 3 — Player Archetype presentation catalog.
 *
 * The *engine* is server-side and locked (docs/07_SOCIAL/PLAYER_ARCHETYPES.md);
 * it awards `{ key, score, awardedAt }` and nothing else. Everything below is
 * presentation copy for those twelve locked keys — no new key is introduced and
 * no score is recomputed on the client.
 *
 * Primary / secondary are simply the two highest-scoring awarded badges.
 */

export interface ArchetypeProfile {
  key: PlayerArchetypeKey;
  title: string;
  /** Lucide icon name — resolved to a component at render time. */
  icon: string;
  /** One-sentence explanation of what earned it. */
  explanation: string;
  strengths: readonly string[];
  weaknesses: readonly string[];
}

export const ARCHETYPE_CATALOG: Record<PlayerArchetypeKey, ArchetypeProfile> = {
  collector: {
    key: 'collector',
    title: 'The Collector',
    icon: 'library',
    explanation: 'Your library and lists grow faster than almost anyone else on the platform.',
    strengths: ['Deep catalog knowledge', 'Curates lists others rely on', 'Never misses a sale'],
    weaknesses: ['Owns more than gets played', 'Breadth over depth'],
  },
  completionist: {
    key: 'completionist',
    title: 'The Completionist',
    icon: 'circle-check-big',
    explanation: 'You finish what you start — your completion rate sits well above average.',
    strengths: ['Sees credits roll', 'Reliable end-game opinions', 'High follow-through'],
    weaknesses: ['Slow to drop a bad game', 'Fewer games sampled'],
  },
  tryhard: {
    key: 'tryhard',
    title: 'The Tryhard',
    icon: 'flame',
    explanation: 'You log sessions densely — when you play a game, you really play it.',
    strengths: ['Mastery of mechanics', 'Long uninterrupted runs', 'Knows the meta'],
    weaknesses: ['Burnout risk', 'Narrow rotation'],
  },
  explorer: {
    key: 'explorer',
    title: 'The Explorer',
    icon: 'compass',
    explanation: 'Your genre spread is unusually wide — you will try almost anything once.',
    strengths: ['Genre-fluent', 'Finds games before they trend', 'Great recommendations'],
    weaknesses: ['Rarely finishes', 'Opinions spread thin'],
  },
  reviewer: {
    key: 'reviewer',
    title: 'The Reviewer',
    icon: 'pen-line',
    explanation: 'You write often, and you write at length.',
    strengths: ['Articulates why a game works', 'Trusted by followers', 'Consistent output'],
    weaknesses: ['Spends longer writing than playing', 'Strong opinions land hard'],
  },
  speedrunner: {
    key: 'speedrunner',
    title: 'The Speedrunner',
    icon: 'timer',
    explanation: 'You complete games in far fewer sessions than most players need.',
    strengths: ['Efficient', 'Optimises routes instinctively', 'High completion throughput'],
    weaknesses: ['Skips side content', 'Misses slow-burn storytelling'],
  },
  backlog_hoarder: {
    key: 'backlog_hoarder',
    title: 'The Backlog Hoarder',
    icon: 'layers',
    explanation: 'Your backlog has grown considerably faster than your completed shelf.',
    strengths: ['Always something to play', 'Patient buyer', 'Enormous variety on tap'],
    weaknesses: ['Decision paralysis', 'Backlog outpaces free time'],
  },
  competitive: {
    key: 'competitive',
    title: 'The Competitor',
    icon: 'swords',
    explanation: 'You show up for events and stay active across communities.',
    strengths: [
      'Thrives under pressure',
      'Organises and joins events',
      'Strong community presence',
    ],
    weaknesses: ['Less patient with slow games', 'Results-focused'],
  },
  story_lover: {
    key: 'story_lover',
    title: 'The Story Lover',
    icon: 'book-open',
    explanation: 'Your library leans heavily toward narrative-driven RPGs and adventures.',
    strengths: ['Reads every codex entry', 'Deep on writing and characters', 'Patient pacing'],
    weaknesses: ['Avoids competitive play', 'Slower completion times'],
  },
  indie_hunter: {
    key: 'indie_hunter',
    title: 'The Indie Hunter',
    icon: 'gem',
    explanation: 'You favour smaller studios well before the rest of the platform notices them.',
    strengths: ['Finds hidden gems', 'Supports small developers', 'Distinctive taste'],
    weaknesses: ['Skips blockbusters', 'Recommendations can be niche'],
  },
  achievement_hunter: {
    key: 'achievement_hunter',
    title: 'The Achievement Hunter',
    icon: 'trophy',
    explanation: 'You have unlocked a large share of the GMRLOG achievements available to you.',
    strengths: ['Thorough', 'Systematic', 'Squeezes every corner of a game'],
    weaknesses: ['Grinds past the fun', 'Checklist-driven'],
  },
  social_gamer: {
    key: 'social_gamer',
    title: 'The Social Gamer',
    icon: 'users',
    explanation: 'Friends, follows, communities and comments — you are here for the people.',
    strengths: ['Connects players', 'Active in discussion', 'Builds communities'],
    weaknesses: ['Plays less solo', 'Opinions shaped by the group'],
  },
};

/**
 * Rarity from the engine's comparative score. The engine documents score as
 * comparative within itself with thresholded awards, so the bands below read a
 * *relative* strength — a legendary badge means the signal was overwhelming, not
 * that few players hold it.
 */
export function archetypeRarity(score: number): RarityTier {
  if (score >= 90) {
    return 'legendary';
  }
  if (score >= 75) {
    return 'epic';
  }
  if (score >= 55) {
    return 'rare';
  }
  if (score >= 35) {
    return 'uncommon';
  }
  return 'common';
}

export interface ResolvedArchetype {
  profile: ArchetypeProfile;
  score: number;
  rarity: RarityTier;
  awardedAt: string;
}

export function resolveArchetype(item: PlayerArchetypeResponse): ResolvedArchetype | null {
  // The engine may award a key before the client ships copy for it — the wire
  // type cannot express that, so check membership rather than trusting the type.
  if (!(item.key in ARCHETYPE_CATALOG)) {
    return null;
  }
  const profile = ARCHETYPE_CATALOG[item.key];
  return {
    profile,
    score: item.score,
    rarity: archetypeRarity(item.score),
    awardedAt: item.awardedAt,
  };
}

export interface ArchetypePair {
  primary: ResolvedArchetype | null;
  secondary: ResolvedArchetype | null;
  others: ResolvedArchetype[];
}

/**
 * Primary + secondary + the rest, highest score first. Ties break on key so the
 * ordering is stable between renders and between devices.
 */
export function resolveArchetypePair(items: readonly PlayerArchetypeResponse[]): ArchetypePair {
  const resolved = items
    .map(resolveArchetype)
    .filter((item): item is ResolvedArchetype => item !== null)
    .sort((a, b) => b.score - a.score || a.profile.key.localeCompare(b.profile.key));

  return {
    primary: resolved[0] ?? null,
    secondary: resolved[1] ?? null,
    others: resolved.slice(2),
  };
}
