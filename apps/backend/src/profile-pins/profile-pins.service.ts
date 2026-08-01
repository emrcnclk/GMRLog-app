import type {
  CollectionRepository,
  GameRepository,
  ProfilePinRepository,
  ReviewRepository,
  UserRepository,
} from '@gmrlog/database';
import type { ProfilePinResponse } from '@gmrlog/types';
import type { ProfilePinDeleteInput, ProfilePinUpsertInput } from '@gmrlog/validators';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { toProfilePinResponse } from './mappers/profile-pin.mapper';
import {
  PROFILE_PIN_COLLECTION_REPOSITORY,
  PROFILE_PIN_GAME_REPOSITORY,
  PROFILE_PIN_REPOSITORY,
  PROFILE_PIN_REVIEW_REPOSITORY,
  PROFILE_PIN_USER_REPOSITORY,
} from './profile-pins.tokens';

/**
 * Profile showcase pins (D3.21). Validates target object exists for kind.
 */
@Injectable()
export class ProfilePinsService {
  constructor(
    @Inject(PROFILE_PIN_REPOSITORY) private readonly pins: ProfilePinRepository,
    @Inject(PROFILE_PIN_USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PROFILE_PIN_GAME_REPOSITORY) private readonly games: GameRepository,
    @Inject(PROFILE_PIN_REVIEW_REPOSITORY) private readonly reviews: ReviewRepository,
    @Inject(PROFILE_PIN_COLLECTION_REPOSITORY) private readonly collections: CollectionRepository,
  ) {}

  async listMine(userId: string): Promise<ProfilePinResponse[]> {
    await this.requireActiveUser(userId);
    const rows = await this.pins.listByUser(userId);
    return rows.map(toProfilePinResponse);
  }

  async upsert(userId: string, input: ProfilePinUpsertInput): Promise<ProfilePinResponse> {
    await this.requireActiveUser(userId);
    await this.requirePinTarget(userId, input.kind, input.objectId);
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

  private async requirePinTarget(
    userId: string,
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
      if (review.authorId !== userId) {
        throw new BadRequestException('Can only pin your own review');
      }
      return;
    }
    const collection = await this.collections.findActiveById(objectId);
    if (collection == null) {
      throw new BadRequestException('Pinned collection does not exist');
    }
    if (collection.ownerId !== userId) {
      throw new BadRequestException('Can only pin your own collection');
    }
  }

  private async requireActiveUser(userId: string): Promise<void> {
    const user = await this.users.findById(userId);
    if (user == null || user.deletedAt != null) {
      throw new NotFoundException('User not found');
    }
  }
}
