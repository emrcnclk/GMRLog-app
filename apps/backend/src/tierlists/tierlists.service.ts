import type {
  FollowRepository,
  Game,
  GameRepository,
  Prisma,
  TierList,
  TierListRepository,
  TierSlotBoardRow,
  TierSlotRepository,
  User,
  UserRepository,
} from '@gmrlog/database';
import type { TierListResponse } from '@gmrlog/types';
import type { TierListCreateInput, TierListPatchInput } from '@gmrlog/validators';
import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { isAuthenticatedIdentity, type RequestIdentity } from '../auth/interfaces/identity';
import { FOLLOW_REPOSITORY } from '../follows/follows.tokens';

import { canViewerReadTierList, toTierListResponse } from './mappers/tierlist.mapper';
import {
  TIER_LIST_GAME_REPOSITORY,
  TIER_LIST_REPOSITORY,
  TIER_LIST_USER_REPOSITORY,
  TIER_SLOT_REPOSITORY,
} from './tierlists.tokens';

/**
 * Tier list domain service (F6.3 / D2.9). Owns CRUD, soft-delete, ownership,
 * and visibility. Board replace lives in TierSlotService.
 */
@Injectable()
export class TierListsService {
  constructor(
    @Inject(TIER_LIST_REPOSITORY) private readonly tierLists: TierListRepository,
    @Inject(TIER_SLOT_REPOSITORY) private readonly slots: TierSlotRepository,
    @Inject(TIER_LIST_USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(TIER_LIST_GAME_REPOSITORY) private readonly games: GameRepository,
    @Inject(FOLLOW_REPOSITORY) private readonly follows: FollowRepository,
  ) {}

  async listOwn(actorId: string): Promise<TierListResponse[]> {
    const rows = await this.tierLists.listByOwner(actorId);
    return this.projectMany(rows);
  }

  async getTierList(tierListId: string, identity: RequestIdentity): Promise<TierListResponse> {
    const tierList = await this.requireActiveTierList(tierListId);
    await this.assertReadable(tierList, identity);
    return this.project(tierList);
  }

  async createTierList(ownerId: string, input: TierListCreateInput): Promise<TierListResponse> {
    const created = await this.tierLists.create({
      owner: { connect: { id: ownerId } },
      title: input.title,
      visibility: input.visibility ?? 'public',
    });
    return this.project(created);
  }

  async updateTierList(
    tierListId: string,
    actorId: string,
    input: TierListPatchInput,
  ): Promise<TierListResponse> {
    const tierList = await this.requireActiveTierList(tierListId);
    this.assertOwner(tierList, actorId);

    const data: Prisma.TierListUpdateInput = {
      version: { increment: 1 },
    };
    if (input.title !== undefined) {
      data.title = input.title;
    }
    if (input.visibility !== undefined) {
      data.visibility = input.visibility;
    }

    const updated = await this.tierLists.update(tierList.id, data);
    return this.project(updated);
  }

  /** S2 §13 — soft-delete. Slots remain until hard delete cascade. */
  async deleteTierList(tierListId: string, actorId: string): Promise<void> {
    const tierList = await this.requireActiveTierList(tierListId);
    this.assertOwner(tierList, actorId);
    await this.tierLists.softDelete(tierList.id);
  }

  async project(tierList: TierList): Promise<TierListResponse> {
    const [owner, board] = await Promise.all([
      this.requireUser(tierList.ownerId),
      this.slots.listSlots(tierList.id),
    ]);
    const gamesById = await this.loadGamesById(collectGameIds(board));
    return toTierListResponse(tierList, owner, board, gamesById);
  }

  private async projectMany(rows: TierList[]): Promise<TierListResponse[]> {
    if (rows.length === 0) {
      return [];
    }
    const ownersById = await this.loadUsersById(rows.map((row) => row.ownerId));
    const results: TierListResponse[] = [];
    for (const row of rows) {
      const board = await this.slots.listSlots(row.id);
      const gamesById = await this.loadGamesById(collectGameIds(board));
      results.push(
        toTierListResponse(row, this.requireLoadedUser(ownersById, row.ownerId), board, gamesById),
      );
    }
    return results;
  }

  async requireActiveTierList(tierListId: string): Promise<TierList> {
    const tierList = await this.tierLists.findActiveById(tierListId);
    if (!tierList) {
      throw new NotFoundException('Tier list not found');
    }
    return tierList;
  }

  assertOwner(tierList: TierList, actorId: string): void {
    if (tierList.ownerId !== actorId) {
      throw new ForbiddenException('Only the owner may modify this tier list');
    }
  }

  private async assertReadable(tierList: TierList, identity: RequestIdentity): Promise<void> {
    if (!(await this.isReadable(tierList.visibility, tierList.ownerId, viewerIdOf(identity)))) {
      throw new NotFoundException('Tier list not found');
    }
  }

  private async isReadable(
    visibility: TierList['visibility'],
    ownerId: string,
    viewerId: string | null,
  ): Promise<boolean> {
    let viewerFollowsOwner = false;
    if (visibility === 'followers' && viewerId != null && viewerId !== ownerId) {
      viewerFollowsOwner = await this.follows.exists(viewerId, ownerId);
    }
    return canViewerReadTierList(visibility, ownerId, viewerId, viewerFollowsOwner);
  }

  private async requireUser(userId: string): Promise<User> {
    const user = await this.users.findById(userId);
    if (user == null || user.deletedAt != null) {
      throw new NotFoundException('Owner not found');
    }
    return user;
  }

  private async loadUsersById(userIds: string[]): Promise<Map<string, User>> {
    const unique = [...new Set(userIds)];
    const loaded = await this.users.findManyByIds(unique);
    return new Map(loaded.map((user) => [user.id, user]));
  }

  private requireLoadedUser(usersById: Map<string, User>, userId: string): User {
    const user = usersById.get(userId);
    if (!user) {
      throw new NotFoundException('Owner not found');
    }
    return user;
  }

  private async loadGamesById(gameIds: string[]): Promise<Map<string, Game>> {
    const unique = [...new Set(gameIds)];
    const loaded = await this.games.findManyByIds(unique);
    return new Map(loaded.map((game) => [game.id, game]));
  }
}

function collectGameIds(board: TierSlotBoardRow[]): string[] {
  return board.flatMap((row) => row.games.map((g) => g.gameId));
}

function viewerIdOf(identity: RequestIdentity): string | null {
  return isAuthenticatedIdentity(identity) ? identity.userId : null;
}
