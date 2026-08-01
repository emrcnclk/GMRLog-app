import type {
  PlayerMetricSnapshot,
  PlayerMetricsRepository,
  UserArchetypeRepository,
  UserRepository,
} from '@gmrlog/database';
import type { PlayerArchetypeKey, PlayerArchetypeResponse } from '@gmrlog/types';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  ARCHETYPE_METRICS_REPOSITORY,
  ARCHETYPE_REPOSITORY,
  ARCHETYPE_USER_REPOSITORY,
} from './archetypes.tokens';
import { toPlayerArchetypeResponse } from './mappers/archetype.mapper';

/** Minimum score (0–100) required to persist a badge. Multiple badges allowed. */
const AWARD_THRESHOLD = 40;

const STORY_GENRE_HINTS = ['rpg', 'adventure', 'story', 'narrative', 'visual novel'] as const;

/**
 * Player archetype engine (D3.21 / PLAYER_ARCHETYPES.md).
 * Deterministic rule scores — no AI classification.
 */
@Injectable()
export class ArchetypeEngineService {
  constructor(
    @Inject(ARCHETYPE_REPOSITORY) private readonly archetypes: UserArchetypeRepository,
    @Inject(ARCHETYPE_METRICS_REPOSITORY) private readonly metrics: PlayerMetricsRepository,
    @Inject(ARCHETYPE_USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async listForUser(userId: string): Promise<PlayerArchetypeResponse[]> {
    await this.requireActiveUser(userId);
    const rows = await this.archetypes.listByUser(userId);
    return rows.map(toPlayerArchetypeResponse);
  }

  /**
   * Replaces UserArchetype rows for the player from current metrics.
   * Safe to call after library / social / achievement deltas and on stats reads.
   */
  async recalculate(userId: string): Promise<PlayerArchetypeResponse[]> {
    await this.requireActiveUser(userId);
    const snapshot = await this.metrics.loadSnapshot(userId);
    if (snapshot == null) {
      throw new NotFoundException('User not found');
    }

    const scored = scoreArchetypes(snapshot).filter((row) => row.score >= AWARD_THRESHOLD);
    const rows = await this.archetypes.replaceForUser(userId, scored);
    return rows.map(toPlayerArchetypeResponse);
  }

  private async requireActiveUser(userId: string): Promise<void> {
    const user = await this.users.findById(userId);
    if (user == null || user.deletedAt != null) {
      throw new NotFoundException('User not found');
    }
  }
}

interface ScoredArchetype {
  archetypeKey: PlayerArchetypeKey;
  score: number;
}

function scoreArchetypes(snapshot: PlayerMetricSnapshot): ScoredArchetype[] {
  const owned = snapshot.libraryByStatus.get('owned') ?? 0;
  const wishlist = snapshot.libraryByStatus.get('wishlist') ?? 0;
  const completed = snapshot.libraryByStatus.get('completed') ?? 0;
  const backlog = snapshot.libraryByStatus.get('backlog') ?? 0;
  const playing = snapshot.libraryByStatus.get('playing') ?? 0;
  const loggedShelf = owned + wishlist + completed + backlog + playing;
  const completionPercent =
    loggedShelf === 0 ? 0 : Math.round((completed / Math.max(1, loggedShelf)) * 100);

  const uniqueGenres = snapshot.genreCounts.size;
  const reviewCount = snapshot.reviews.length;
  const avgBodyLength =
    reviewCount === 0
      ? 0
      : snapshot.reviews.reduce((sum, review) => sum + review.bodyLength, 0) / reviewCount;

  // collector — many owned / wishlist / collection entries
  const collector = clampScore(owned + wishlist + snapshot.collections.length * 5);

  // completionist — high completed / library completion %
  const completionist = clampScore(completionPercent);

  // tryhard — high session log density
  const tryhard = clampScore(snapshot.sessionLogCount * 2);

  // explorer — broad genre diversity
  const explorer = clampScore(uniqueGenres * 12);

  // reviewer — review count + length
  const reviewer = clampScore(reviewCount * 5 + Math.floor(avgBodyLength / 40));

  // speedrunner — fast complete cycles (completed vs play sessions)
  const speedrunner =
    completed === 0
      ? 0
      : clampScore(Math.round((completed / Math.max(1, snapshot.sessionLogCount)) * 80));

  // backlog_hoarder — large backlog relative to completed
  const backlog_hoarder =
    backlog === 0 ? 0 : clampScore(Math.round((backlog / Math.max(1, completed)) * 35));

  // competitive — event participations / community density
  const competitive = clampScore(
    snapshot.communityCount * 10 + snapshot.eventParticipationCount * 15,
  );

  // story_lover — story-leaning genre affinity (RPG/Adventure proxies)
  const storyHits = countMatchingGenres(snapshot.genreCounts, STORY_GENRE_HINTS);
  const story_lover =
    snapshot.genreCounts.size === 0
      ? 0
      : clampScore(Math.round((storyHits / sumMap(snapshot.genreCounts)) * 100));

  // indie_hunter — skip when catalog has no indie tags (honest low score)
  const indie_hunter = 0;

  // achievement_hunter — awarded GMRLOG achievements
  const achievement_hunter = clampScore(snapshot.achievementAwardedCount * 10);

  // social_gamer — friends + follows + communities + comments
  const social_gamer = clampScore(
    snapshot.friendCount * 5 +
      snapshot.followingCount * 2 +
      snapshot.communityCount * 5 +
      Math.min(30, snapshot.commentCount),
  );

  return [
    { archetypeKey: 'collector', score: collector },
    { archetypeKey: 'completionist', score: completionist },
    { archetypeKey: 'tryhard', score: tryhard },
    { archetypeKey: 'explorer', score: explorer },
    { archetypeKey: 'reviewer', score: reviewer },
    { archetypeKey: 'speedrunner', score: speedrunner },
    { archetypeKey: 'backlog_hoarder', score: backlog_hoarder },
    { archetypeKey: 'competitive', score: competitive },
    { archetypeKey: 'story_lover', score: story_lover },
    { archetypeKey: 'indie_hunter', score: indie_hunter },
    { archetypeKey: 'achievement_hunter', score: achievement_hunter },
    { archetypeKey: 'social_gamer', score: social_gamer },
  ];
}

function clampScore(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return Math.min(100, Math.round(value));
}

function sumMap(map: ReadonlyMap<string, number>): number {
  let total = 0;
  for (const value of map.values()) {
    total += value;
  }
  return Math.max(1, total);
}

function countMatchingGenres(
  genreCounts: ReadonlyMap<string, number>,
  hints: readonly string[],
): number {
  let hits = 0;
  for (const [name, count] of genreCounts) {
    const lower = name.toLowerCase();
    if (hints.some((hint) => lower.includes(hint))) {
      hits += count;
    }
  }
  return hits;
}
