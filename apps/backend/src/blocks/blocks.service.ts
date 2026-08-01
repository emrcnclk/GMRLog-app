import type { BlockRepository, User, UserRepository } from '@gmrlog/database';
import type { BlockResponse } from '@gmrlog/types';
import type { BlockCreateInput } from '@gmrlog/validators';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { BLOCK_REPOSITORY, BLOCK_USER_REPOSITORY } from './blocks.tokens';
import { toBlockResponse } from './mappers/block.mapper';

/**
 * Blocks domain service (F6.3 / S1 §13.13). Directed block edges only.
 * No follow cascade · feed filtering · notifications.
 */
@Injectable()
export class BlocksService {
  constructor(
    @Inject(BLOCK_REPOSITORY) private readonly blocks: BlockRepository,
    @Inject(BLOCK_USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async blockUser(actorId: string, input: BlockCreateInput): Promise<BlockResponse> {
    if (actorId === input.userId) {
      throw new BadRequestException('Cannot block yourself');
    }

    const blocked = await this.requireActiveUser(input.userId);
    const existing = await this.blocks.findByPair(actorId, input.userId);
    if (existing) {
      throw new ConflictException('User is already blocked');
    }

    const created = await this.blocks.create({
      blocker: { connect: { id: actorId } },
      blocked: { connect: { id: input.userId } },
    });
    const blocker = await this.requireActiveUser(actorId);
    return toBlockResponse(created, blocker, blocked);
  }

  async unblockUser(actorId: string, blockedId: string): Promise<void> {
    await this.requireActiveUser(blockedId);
    const deleted = await this.blocks.deleteByPair(actorId, blockedId);
    if (!deleted) {
      throw new NotFoundException('Block relationship not found');
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
