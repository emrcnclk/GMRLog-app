import type { MuteRepository, User, UserRepository } from '@gmrlog/database';
import type { MuteResponse } from '@gmrlog/types';
import type { MuteCreateInput } from '@gmrlog/validators';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { toUserPublicResponse } from '../posts/mappers/post.mapper';

import { MUTE_REPOSITORY, MUTE_USER_REPOSITORY } from './mutes.tokens';

/** D3.24 Mute — soft exclude from viewer feed only. */
@Injectable()
export class MutesService {
  constructor(
    @Inject(MUTE_REPOSITORY) private readonly mutes: MuteRepository,
    @Inject(MUTE_USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async muteUser(actorId: string, input: MuteCreateInput): Promise<MuteResponse> {
    if (actorId === input.userId) {
      throw new BadRequestException('Cannot mute yourself');
    }
    const muted = await this.requireActiveUser(input.userId);
    if (await this.mutes.exists(actorId, input.userId)) {
      throw new ConflictException('User is already muted');
    }
    const created = await this.mutes.create({
      muter: { connect: { id: actorId } },
      muted: { connect: { id: input.userId } },
    });
    const muter = await this.requireActiveUser(actorId);
    return {
      muter: toUserPublicResponse(muter),
      muted: toUserPublicResponse(muted),
      createdAt: created.createdAt.toISOString(),
    };
  }

  async unmuteUser(actorId: string, mutedId: string): Promise<void> {
    await this.requireActiveUser(mutedId);
    const deleted = await this.mutes.deleteByPair(actorId, mutedId);
    if (!deleted) {
      throw new NotFoundException('Mute relationship not found');
    }
  }

  listMutedIds(actorId: string): Promise<string[]> {
    return this.mutes.listMutedIds(actorId);
  }

  private async requireActiveUser(userId: string): Promise<User> {
    const user = await this.users.findById(userId);
    if (user == null || user.deletedAt != null) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
