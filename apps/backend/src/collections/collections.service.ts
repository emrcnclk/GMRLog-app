import type {
  Collection,
  CollectionEntry,
  CollectionEntryRepository,
  CollectionRepository,
  FollowRepository,
  Game,
  GameRepository,
  Prisma,
  User,
  UserRepository,
} from '@gmrlog/database';
import type { CollectionResponse, UserPublicResponse } from '@gmrlog/types';
import type {
  CollectionCreateInput,
  CollectionPatchInput,
  CollectionsQueryInput,
} from '@gmrlog/validators';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { isAuthenticatedIdentity, type RequestIdentity } from '../auth/interfaces/identity';
import { FOLLOW_REPOSITORY } from '../follows/follows.tokens';
import { PrismaService } from '../infrastructure/database/prisma.service';

import {
  COLLECTION_ENTRY_REPOSITORY,
  COLLECTION_GAME_REPOSITORY,
  COLLECTION_REPOSITORY,
  COLLECTION_USER_REPOSITORY,
} from './collections.tokens';
import { DynamicCollectionResolver } from './dynamic-collection.resolver';
import {
  canViewerReadCollection,
  toCollectionResponse,
  toUserPublicResponse,
} from './mappers/collection.mapper';

/**
 * Collection domain service (F6.3 / D2.8 / D3.22). Owns curated collection CRUD,
 * soft-delete, ownership, visibility, follow, clone, and dynamic membership.
 * Entry replace lives in CollectionEntriesService.
 */
@Injectable()
export class CollectionsService {
  constructor(
    @Inject(COLLECTION_REPOSITORY) private readonly collections: CollectionRepository,
    @Inject(COLLECTION_ENTRY_REPOSITORY) private readonly entries: CollectionEntryRepository,
    @Inject(COLLECTION_USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(COLLECTION_GAME_REPOSITORY) private readonly games: GameRepository,
    @Inject(FOLLOW_REPOSITORY) private readonly follows: FollowRepository,
    private readonly prisma: PrismaService,
    private readonly dynamicResolver: DynamicCollectionResolver,
  ) {}

  async listCollections(
    actorId: string,
    query: CollectionsQueryInput = {},
  ): Promise<CollectionResponse[]> {
    const ownerId = query.ownerId ?? actorId;
    const rows =
      ownerId === actorId
        ? await this.collections.listByOwner(ownerId)
        : await this.collections.listPublicByOwner(ownerId);
    return this.projectMany(rows);
  }

  async getCollection(
    collectionId: string,
    identity: RequestIdentity,
  ): Promise<CollectionResponse> {
    const collection = await this.requireActiveCollection(collectionId);
    await this.assertReadable(collection, identity);
    return this.project(collection);
  }

  async createCollection(
    ownerId: string,
    input: CollectionCreateInput,
  ): Promise<CollectionResponse> {
    const type = input.type ?? 'manual';
    this.assertDynamicRule(type, input.ruleKey ?? null);

    const created = await this.collections.create({
      owner: { connect: { id: ownerId } },
      title: input.title,
      visibility: input.visibility ?? 'public',
      type,
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.ruleKey !== undefined ? { ruleKey: input.ruleKey } : {}),
      ...(input.color !== undefined ? { color: input.color } : {}),
      ...(input.tags !== undefined ? { tags: input.tags } : {}),
    });
    return this.project(created);
  }

  async updateCollection(
    collectionId: string,
    actorId: string,
    input: CollectionPatchInput,
  ): Promise<CollectionResponse> {
    const collection = await this.requireActiveCollection(collectionId);
    this.assertOwner(collection, actorId);

    const nextType = input.type ?? collection.type;
    const nextRuleKey = input.ruleKey !== undefined ? input.ruleKey : collection.ruleKey;
    this.assertDynamicRule(nextType, nextRuleKey);

    const data: Prisma.CollectionUpdateInput = {
      version: { increment: 1 },
    };
    if (input.title !== undefined) {
      data.title = input.title;
    }
    if (input.description !== undefined) {
      data.description = input.description;
    }
    if (input.visibility !== undefined) {
      data.visibility = input.visibility;
    }
    if (input.type !== undefined) {
      data.type = input.type;
    }
    if (input.ruleKey !== undefined) {
      data.ruleKey = input.ruleKey;
    }
    if (input.color !== undefined) {
      data.color = input.color;
    }
    if (input.tags !== undefined) {
      data.tags = input.tags;
    }

    const updated = await this.collections.update(collection.id, data);
    return this.project(updated);
  }

  /** S2 §13 — soft-delete. Entries remain as structural children until hard delete. */
  async deleteCollection(collectionId: string, actorId: string): Promise<void> {
    const collection = await this.requireActiveCollection(collectionId);
    this.assertOwner(collection, actorId);
    await this.collections.softDelete(collection.id);
  }

  /**
   * Follow a readable collection. Idempotent when the edge already exists.
   * Owners may not follow their own collection.
   */
  async followCollection(userId: string, collectionId: string): Promise<void> {
    const collection = await this.requireActiveCollection(collectionId);
    await this.assertReadable(collection, { class: 'player', userId } satisfies RequestIdentity);
    if (collection.ownerId === userId) {
      throw new BadRequestException('Cannot follow your own collection');
    }
    const existing = await this.prisma.collectionFollower.findUnique({
      where: {
        collectionId_userId: { collectionId: collection.id, userId },
      },
      select: { id: true },
    });
    if (existing !== null) {
      return;
    }
    try {
      await this.prisma.collectionFollower.create({
        data: {
          collection: { connect: { id: collection.id } },
          user: { connect: { id: userId } },
        },
      });
    } catch (error: unknown) {
      if (isUniqueViolation(error)) {
        return;
      }
      throw error;
    }
  }

  async unfollowCollection(userId: string, collectionId: string): Promise<void> {
    const collection = await this.requireActiveCollection(collectionId);
    const deleted = await this.prisma.collectionFollower.deleteMany({
      where: { collectionId: collection.id, userId },
    });
    if (deleted.count === 0) {
      throw new NotFoundException('Collection follow not found');
    }
  }

  async listFollowers(
    collectionId: string,
    identity: RequestIdentity,
  ): Promise<UserPublicResponse[]> {
    const collection = await this.requireActiveCollection(collectionId);
    await this.assertReadable(collection, identity);
    const rows = await this.prisma.collectionFollower.findMany({
      where: { collectionId: collection.id },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: { userId: true },
    });
    if (rows.length === 0) {
      return [];
    }
    const usersById = await this.loadUsersById(rows.map((row) => row.userId));
    return rows.flatMap((row) => {
      const user = usersById.get(row.userId);
      if (user == null || user.deletedAt != null) {
        return [];
      }
      return [toUserPublicResponse(user)];
    });
  }

  /**
   * Clone a readable collection as a new `manual` shelf owned by the actor.
   * Copies title+(copy), description, tags, and current membership entries.
   */
  async cloneCollection(actorId: string, collectionId: string): Promise<CollectionResponse> {
    const source = await this.requireActiveCollection(collectionId);
    await this.assertReadable(source, {
      class: 'player',
      userId: actorId,
    } satisfies RequestIdentity);

    const membership = await this.resolveMembershipEntries(source);
    const created = await this.collections.create({
      owner: { connect: { id: actorId } },
      title: `${source.title} (copy)`,
      description: source.description,
      visibility: 'private',
      type: 'manual',
      ruleKey: null,
      tags: source.tags,
      color: source.color,
    });

    if (membership.length > 0) {
      await this.entries.replaceEntries(
        created.id,
        membership.map((entry, index) => ({
          gameId: entry.gameId,
          position: index,
          note: entry.note,
        })),
      );
    }

    return this.project(created);
  }

  async project(collection: Collection): Promise<CollectionResponse> {
    const [owner, entryRows, followerCount] = await Promise.all([
      this.requireUser(collection.ownerId),
      this.resolveMembershipEntries(collection),
      this.countFollowers(collection.id),
    ]);
    const gamesById = await this.loadGamesById(entryRows.map((row) => row.gameId));
    return toCollectionResponse(collection, owner, entryRows, gamesById, followerCount);
  }

  private async projectMany(rows: Collection[]): Promise<CollectionResponse[]> {
    if (rows.length === 0) {
      return [];
    }
    const ownersById = await this.loadUsersById(rows.map((row) => row.ownerId));
    const results: CollectionResponse[] = [];
    for (const row of rows) {
      const [entryRows, followerCount] = await Promise.all([
        this.resolveMembershipEntries(row),
        this.countFollowers(row.id),
      ]);
      const gamesById = await this.loadGamesById(entryRows.map((e) => e.gameId));
      results.push(
        toCollectionResponse(
          row,
          this.requireLoadedUser(ownersById, row.ownerId),
          entryRows,
          gamesById,
          followerCount,
        ),
      );
    }
    return results;
  }

  /**
   * Dynamic collections resolve membership via ruleKey at read time.
   * Other types use stored CollectionEntry rows.
   */
  private async resolveMembershipEntries(collection: Collection): Promise<CollectionEntry[]> {
    if (collection.type !== 'dynamic') {
      return this.entries.listByCollection(collection.id);
    }
    const gameIds = await this.dynamicResolver.resolveGameIds(collection.ruleKey);
    return gameIds.map((gameId, position) =>
      syntheticEntry(collection.id, gameId, position, collection.updatedAt),
    );
  }

  private async countFollowers(collectionId: string): Promise<number> {
    return this.prisma.collectionFollower.count({ where: { collectionId } });
  }

  async requireActiveCollection(collectionId: string): Promise<Collection> {
    const collection = await this.collections.findActiveById(collectionId);
    if (!collection) {
      throw new NotFoundException('Collection not found');
    }
    return collection;
  }

  assertOwner(collection: Collection, actorId: string): void {
    if (collection.ownerId !== actorId) {
      throw new ForbiddenException('Only the owner may modify this collection');
    }
  }

  private assertDynamicRule(
    type: Collection['type'] | CollectionCreateInput['type'],
    ruleKey: string | null,
  ): void {
    if (type === 'dynamic' && (ruleKey === null || ruleKey.trim() === '')) {
      throw new BadRequestException('ruleKey is required when type is dynamic');
    }
  }

  private async assertReadable(collection: Collection, identity: RequestIdentity): Promise<void> {
    if (!(await this.isReadable(collection.visibility, collection.ownerId, viewerIdOf(identity)))) {
      throw new NotFoundException('Collection not found');
    }
  }

  private async isReadable(
    visibility: Collection['visibility'],
    ownerId: string,
    viewerId: string | null,
  ): Promise<boolean> {
    let viewerFollowsOwner = false;
    if (visibility === 'followers' && viewerId != null && viewerId !== ownerId) {
      viewerFollowsOwner = await this.follows.exists(viewerId, ownerId);
    }
    return canViewerReadCollection(visibility, ownerId, viewerId, viewerFollowsOwner);
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

function viewerIdOf(identity: RequestIdentity): string | null {
  return isAuthenticatedIdentity(identity) ? identity.userId : null;
}

function syntheticEntry(
  collectionId: string,
  gameId: string,
  position: number,
  at: Date,
): CollectionEntry {
  return {
    id: `dynamic:${collectionId}:${gameId}`,
    collectionId,
    gameId,
    position,
    note: null,
    createdAt: at,
    updatedAt: at,
  };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  );
}
