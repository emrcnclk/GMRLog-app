import type {
  Achievement,
  AchievementProgress,
  AchievementRepository,
  AchievementState,
  ActivityRepository,
  NotificationRepository,
  PlayerMetricSnapshot,
  PlayerMetricsRepository,
  UserRepository,
} from '@gmrlog/database';
import type { AchievementResponse } from '@gmrlog/types';
import { Inject, Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';

import { ArchetypeEngineService } from '../archetypes/archetype-engine.service';

import { ACHIEVEMENT_SEED_DEFINITIONS } from './achievements.definitions';
import {
  ACHIEVEMENT_ACTIVITY_REPOSITORY,
  ACHIEVEMENT_METRICS_REPOSITORY,
  ACHIEVEMENT_NOTIFICATION_REPOSITORY,
  ACHIEVEMENT_REPOSITORY,
  ACHIEVEMENT_USER_REPOSITORY,
} from './achievements.tokens';
import { toAchievementResponse } from './mappers/achievement.mapper';

/**
 * Achievement domain (D3.21). Deterministic progress from PlayerMetricsRepository.
 *
 * Recalculation triggers:
 * - Explicit `recalculate(userId)` (exported for friends accept / library upsert)
 * - Lazy refresh on `GET /me/achievements`
 */
@Injectable()
export class AchievementsService {
  private readonly logger = new Logger(AchievementsService.name);

  constructor(
    @Inject(ACHIEVEMENT_REPOSITORY) private readonly achievements: AchievementRepository,
    @Inject(ACHIEVEMENT_METRICS_REPOSITORY) private readonly metrics: PlayerMetricsRepository,
    @Inject(ACHIEVEMENT_USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(ACHIEVEMENT_NOTIFICATION_REPOSITORY)
    private readonly notifications: NotificationRepository,
    @Inject(ACHIEVEMENT_ACTIVITY_REPOSITORY) private readonly activity: ActivityRepository,
    @Optional() private readonly archetypes?: ArchetypeEngineService,
  ) {}

  async seedDefinitions(): Promise<number> {
    let upserted = 0;
    for (const definition of ACHIEVEMENT_SEED_DEFINITIONS) {
      await this.achievements.upsertDefinition(definition);
      upserted += 1;
    }
    return upserted;
  }

  async listForViewer(
    subjectUserId: string,
    viewerUserId: string | null,
    options: { refresh: boolean } = { refresh: false },
  ): Promise<AchievementResponse[]> {
    await this.requireActiveUser(subjectUserId);
    if (options.refresh && viewerUserId === subjectUserId) {
      await this.recalculate(subjectUserId);
    }

    const [definitions, progressRows] = await Promise.all([
      this.achievements.listDefinitions(),
      this.achievements.listProgressByUser(subjectUserId),
    ]);
    const progressById = new Map(progressRows.map((row) => [row.achievementId, row]));
    const isOwner = viewerUserId === subjectUserId;

    return definitions.map((definition) =>
      toAchievementResponse(definition, progressById.get(definition.id) ?? null, {
        redactHidden: !isOwner,
      }),
    );
  }

  async getById(achievementId: string, viewerUserId: string | null): Promise<AchievementResponse> {
    const definition = await this.achievements.findById(achievementId);
    if (definition == null) {
      throw new NotFoundException('Achievement not found');
    }

    let progress: AchievementProgress | null = null;
    if (viewerUserId != null) {
      progress = await this.achievements.findProgress(achievementId, viewerUserId);
    }

    return toAchievementResponse(definition, progress, {
      redactHidden: progress?.state !== 'awarded',
    });
  }

  /**
   * Recomputes progress for all seeded definitions. Newly awarded rows emit
   * Notification(kind=achievement_unlocked) and ActivityItem(kind=achievement).
   * Also triggers archetype recalculation when ArchetypeEngineService is available.
   */
  async recalculate(userId: string): Promise<AchievementResponse[]> {
    await this.requireActiveUser(userId);
    const snapshot = await this.metrics.loadSnapshot(userId);
    if (snapshot == null) {
      throw new NotFoundException('User not found');
    }

    const definitions = await this.ensureDefinitionsLoaded();
    const existingProgress = await this.achievements.listProgressByUser(userId);
    const previousById = new Map(existingProgress.map((row) => [row.achievementId, row]));

    const results: AchievementResponse[] = [];
    for (const definition of definitions) {
      const current = resolveCriteriaCurrent(definition.criteriaRef, snapshot);
      const previous = previousById.get(definition.id);
      const wasAwarded = previous?.state === 'awarded';
      const state = resolveState(current, definition.target, wasAwarded);
      const newlyAwarded = state === 'awarded' && !wasAwarded;
      const awardedAt = newlyAwarded
        ? new Date()
        : previous?.state === 'awarded'
          ? (previous.awardedAt ?? null)
          : null;

      const progress = await this.achievements.upsertProgress({
        achievementId: definition.id,
        userId,
        current: Math.min(current, definition.target),
        target: definition.target,
        state,
        awardedAt,
      });

      if (newlyAwarded) {
        await this.emitAwardSideEffects(userId, definition, progress);
      }

      results.push(
        toAchievementResponse(definition, progress, {
          redactHidden: false,
        }),
      );
    }

    if (this.archetypes != null) {
      try {
        await this.archetypes.recalculate(userId);
      } catch (error: unknown) {
        this.logger.warn(
          `Archetype recalculation failed for ${userId}: ${error instanceof Error ? error.message : 'unknown'}`,
        );
      }
    }

    return results;
  }

  private async emitAwardSideEffects(
    userId: string,
    definition: Achievement,
    progress: AchievementProgress,
  ): Promise<void> {
    const occurredAt = progress.awardedAt ?? new Date();
    await this.notifications.create({
      recipient: { connect: { id: userId } },
      kind: 'achievement_unlocked',
      objectType: 'achievement',
      objectId: definition.id,
    });

    const item = await this.activity.create({
      kind: 'achievement',
      actor: { connect: { id: userId } },
      objectType: 'achievement',
      objectId: definition.id,
      occurredAt,
    });

    await this.activity.createFeedEntry({
      user: { connect: { id: userId } },
      activityItem: { connect: { id: item.id } },
      rank: 0,
    });
  }

  private async ensureDefinitionsLoaded(): Promise<Achievement[]> {
    const existing = await this.achievements.listDefinitions();
    if (existing.length > 0) {
      return existing;
    }
    await this.seedDefinitions();
    return this.achievements.listDefinitions();
  }

  private async requireActiveUser(userId: string): Promise<void> {
    const user = await this.users.findById(userId);
    if (user == null || user.deletedAt != null) {
      throw new NotFoundException('User not found');
    }
  }
}

function resolveState(current: number, target: number, wasAwarded: boolean): AchievementState {
  if (wasAwarded || current >= target) {
    return 'awarded';
  }
  if (current > 0) {
    return 'in_progress';
  }
  return 'locked';
}

function resolveCriteriaCurrent(criteriaRef: string, snapshot: PlayerMetricSnapshot): number {
  switch (criteriaRef) {
    case 'library.total':
      return snapshot.libraryTotal;
    case 'library.completed':
      return snapshot.libraryByStatus.get('completed') ?? 0;
    case 'library.dropped':
      return snapshot.libraryByStatus.get('dropped') ?? 0;
    case 'reviews.count':
      return snapshot.reviews.length;
    case 'friends.count':
      return snapshot.friendCount;
    case 'collections.count':
      return snapshot.collections.length;
    case 'tier_lists.count':
      return snapshot.tierListCount;
    case 'communities.count':
      return snapshot.communityCount;
    case 'sessions.count':
      return snapshot.sessionLogCount;
    case 'consistency.active_days':
      return snapshot.activeDayCount;
    case 'profile.complete':
      return snapshot.hasAvatar && snapshot.hasBio && snapshot.hasBanner ? 1 : 0;
    default:
      return 0;
  }
}
