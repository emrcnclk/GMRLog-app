import type { BlockRepository, User, UserRepository } from '@gmrlog/database';
import type { BlockResponse } from '@gmrlog/types';
import type { BlockCreateInput, BlocksListQueryInput } from '@gmrlog/validators';
import { DISCOVER_LIST_DEFAULT_LIMIT } from '@gmrlog/validators';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PaginatedPayload } from '../infrastructure/http/paginated-payload';

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

  /**
   * 3b.3a — §15's Blocked tab. This lists directed `Block` edges (viewer as
   * blocker), which is a different signal from `User.deletedAt`: 7.1's
   * leaderboard exclusion collapses "deleted or blocked" into one check
   * because that resource is community-wide and cacheable, not viewer-
   * relative. This route is the opposite case on purpose — it *is*
   * viewer-relative — so it does not touch that decision. A blocked user
   * whose account has since been deleted is dropped from the page rather
   * than rendered, the same defensive filter `FollowsService.projectUsers`
   * already applies, so a row here never points at a profile that is gone.
   */
  async listBlocked(
    actorId: string,
    query: BlocksListQueryInput = {},
  ): Promise<PaginatedPayload<BlockResponse>> {
    const blocker = await this.requireActiveUser(actorId);
    const limit = query.limit ?? DISCOVER_LIST_DEFAULT_LIMIT;
    const cursor = query.cursor !== undefined ? decodeBlocksCursor(query.cursor) : undefined;

    const rows = await this.blocks.listByBlocker(actorId, {
      limit: limit + 1,
      ...(cursor !== undefined ? { cursor } : {}),
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page[page.length - 1];
    const next =
      hasMore && last !== undefined
        ? encodeBlocksCursor({ createdAt: last.createdAt, id: last.id })
        : null;

    const blockedUsers = await this.projectBlockedUsers(page.map((row) => row.blockedId));
    const items = page.flatMap((row) => {
      const blocked = blockedUsers.get(row.blockedId);
      return blocked === undefined ? [] : [toBlockResponse(row, blocker, blocked)];
    });

    return new PaginatedPayload(items, { next }, hasMore, limit);
  }

  private async requireActiveUser(userId: string): Promise<User> {
    const user = await this.users.findById(userId);
    if (user == null || user.deletedAt != null) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private async projectBlockedUsers(userIds: string[]): Promise<Map<string, User>> {
    if (userIds.length === 0) {
      return new Map();
    }
    const loaded = await this.users.findManyByIds(userIds);
    return new Map(loaded.filter((user) => user.deletedAt == null).map((user) => [user.id, user]));
  }
}

function encodeBlocksCursor(cursor: { createdAt: Date; id: string }): string {
  const payload = `${cursor.createdAt.toISOString()}|${cursor.id}`;
  return Buffer.from(payload, 'utf8').toString('base64url');
}

function decodeBlocksCursor(raw: string): { createdAt: Date; id: string } {
  let decoded: string;
  try {
    decoded = Buffer.from(raw, 'base64url').toString('utf8');
  } catch {
    throw new BadRequestException('Invalid cursor');
  }
  const separator = decoded.indexOf('|');
  if (separator <= 0) {
    throw new BadRequestException('Invalid cursor');
  }
  const createdAtRaw = decoded.slice(0, separator);
  const id = decoded.slice(separator + 1);
  const createdAt = new Date(createdAtRaw);
  if (Number.isNaN(createdAt.getTime()) || id.length === 0) {
    throw new BadRequestException('Invalid cursor');
  }
  return { createdAt, id };
}
