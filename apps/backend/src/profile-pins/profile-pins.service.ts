import type {
  AchievementRepository,
  CollectionRepository,
  GameRepository,
  ProfilePin,
  ProfilePinRepository,
  ReviewRepository,
  User,
  UserRepository,
} from '@gmrlog/database';
import type { ProfilePinResponse } from '@gmrlog/types';
import type { ProfilePinDeleteInput, ProfilePinUpsertInput } from '@gmrlog/validators';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { toProfilePinResponse } from './mappers/profile-pin.mapper';
import {
  PROFILE_PIN_ACHIEVEMENT_REPOSITORY,
  PROFILE_PIN_COLLECTION_REPOSITORY,
  PROFILE_PIN_GAME_REPOSITORY,
  PROFILE_PIN_REPOSITORY,
  PROFILE_PIN_REVIEW_REPOSITORY,
  PROFILE_PIN_USER_REPOSITORY,
} from './profile-pins.tokens';

/** 9.5d — at most three badges equipped at once, per §6's three-slot card. */
export const ACHIEVEMENT_PIN_LIMIT = 3;

/**
 * Profile showcase pins (D3.21). Validates target object exists for kind.
 *
 * 9.5d completes the fourth kind, `achievement` (badge equip): unlike the
 * other three, which pin something the player already owns outright, an
 * achievement pin is gated on the achievement being *unlocked* — there is no
 * ownership/entitlement concept in this app (3b.5/3b.6 closed that door) and
 * none is invented here. Both read paths (`listMine`, `listForViewer`)
 * re-check that gate on every call rather than trusting the write-time
 * validation, since a stale equip row can outlive the state that earned it
 * (the achievement definition can be deleted; nothing cascades to the pin).
 */
@Injectable()
export class ProfilePinsService {
  constructor(
    @Inject(PROFILE_PIN_REPOSITORY) private readonly pins: ProfilePinRepository,
    @Inject(PROFILE_PIN_USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PROFILE_PIN_GAME_REPOSITORY) private readonly games: GameRepository,
    @Inject(PROFILE_PIN_REVIEW_REPOSITORY) private readonly reviews: ReviewRepository,
    @Inject(PROFILE_PIN_COLLECTION_REPOSITORY) private readonly collections: CollectionRepository,
    @Inject(PROFILE_PIN_ACHIEVEMENT_REPOSITORY)
    private readonly achievements: AchievementRepository,
  ) {}

  async listMine(userId: string): Promise<ProfilePinResponse[]> {
    const user = await this.requireActiveUser(userId);
    const rows = await this.pins.listByUser(userId);
    return this.filterVisiblePins(rows, user);
  }

  /** 9.5d — read-only, for any viewer looking at `subjectUserId`'s profile. */
  async listForViewer(subjectUserId: string): Promise<ProfilePinResponse[]> {
    const subject = await this.requireActiveUser(subjectUserId);
    const rows = await this.pins.listByUser(subjectUserId);
    return this.filterVisiblePins(rows, subject);
  }

  async upsert(userId: string, input: ProfilePinUpsertInput): Promise<ProfilePinResponse> {
    const user = await this.requireActiveUser(userId);
    await this.requirePinTarget(user, input.kind, input.objectId);

    if (input.kind === 'achievement') {
      const existing = await this.pins.listByUser(userId);
      const achievementPins = existing.filter((row) => row.kind === 'achievement');
      const alreadyEquipped = achievementPins.some((row) => row.objectId === input.objectId);
      if (!alreadyEquipped && achievementPins.length >= ACHIEVEMENT_PIN_LIMIT) {
        throw new BadRequestException(
          `Only ${String(ACHIEVEMENT_PIN_LIMIT)} badges may be equipped at once`,
        );
      }
    }

    const row = await this.pins.upsert({
      userId,
      kind: input.kind,
      objectId: input.objectId,
      position: input.position ?? 0,
    });
    return toProfilePinResponse(row);
  }

  async delete(userId: string, input: ProfilePinDeleteInput): Promise<void> {
    await this.requireActiveUser(userId);
    const deleted = await this.pins.delete(userId, input.kind, input.objectId);
    if (deleted == null) {
      throw new NotFoundException('Profile pin not found');
    }
  }

  /**
   * Read-path authority for `achievement` pins: a pin only ever renders when
   * its owner is an individual account (achievements are excluded from
   * organisation accounts the same way `AchievementsService.computeHolderPercents`
   * already excludes them from the holder/eligible-player counts — this is
   * that same "not a player" boundary, not a new decision) *and* the
   * achievement is currently `awarded` for that user. Filtered out, never
   * errored — the same "omit rather than fabricate" pattern 8.3b's DNA-match
   * fix already established for an org-account leak of this shape. Other
   * kinds (game/review/collection) are returned as validated at write time;
   * re-validating their existence on every read was not asked for here and
   * isn't this task's gap.
   */
  private async filterVisiblePins(
    rows: readonly ProfilePin[],
    owner: User,
  ): Promise<ProfilePinResponse[]> {
    const achievementPins = rows.filter((row) => row.kind === 'achievement');
    let awardedIds = new Set<string>();
    if (achievementPins.length > 0 && owner.accountKind === 'individual') {
      const progress = await this.achievements.listProgressByUser(owner.id);
      awardedIds = new Set(
        progress.filter((row) => row.state === 'awarded').map((row) => row.achievementId),
      );
    }
    return rows
      .filter(
        (row) =>
          row.kind !== 'achievement' ||
          (owner.accountKind === 'individual' && awardedIds.has(row.objectId)),
      )
      .map(toProfilePinResponse);
  }

  private async requirePinTarget(
    user: User,
    kind: ProfilePinUpsertInput['kind'],
    objectId: string,
  ): Promise<void> {
    if (kind === 'game') {
      const game = await this.games.findById(objectId);
      if (game == null) {
        throw new BadRequestException('Pinned game does not exist');
      }
      return;
    }
    if (kind === 'review') {
      const review = await this.reviews.findActiveById(objectId);
      if (review == null) {
        throw new BadRequestException('Pinned review does not exist');
      }
      if (review.authorId !== user.id) {
        throw new BadRequestException('Can only pin your own review');
      }
      return;
    }
    if (kind === 'achievement') {
      if (user.accountKind !== 'individual') {
        throw new BadRequestException('Only individual accounts can equip badges');
      }
      const achievement = await this.achievements.findById(objectId);
      if (achievement == null) {
        throw new BadRequestException('Achievement does not exist');
      }
      const progress = await this.achievements.findProgress(objectId, user.id);
      if (progress?.state !== 'awarded') {
        throw new BadRequestException('Can only equip an unlocked achievement');
      }
      return;
    }
    const collection = await this.collections.findActiveById(objectId);
    if (collection == null) {
      throw new BadRequestException('Pinned collection does not exist');
    }
    if (collection.ownerId !== user.id) {
      throw new BadRequestException('Can only pin your own collection');
    }
  }

  private async requireActiveUser(userId: string): Promise<User> {
    const user = await this.users.findById(userId);
    if (user == null || user.deletedAt != null) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
