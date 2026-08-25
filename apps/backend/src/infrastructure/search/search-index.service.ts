import type { SearchHitRecord, SearchHitType } from '@gmrlog/database';
import {
  PrismaCollectionRepository,
  PrismaCommunityRepository,
  PrismaEventRepository,
  PrismaGameRepository,
  PrismaPostRepository,
  PrismaReviewRepository,
  PrismaTierListRepository,
  PrismaUserRepository,
} from '@gmrlog/database';
import { Injectable } from '@nestjs/common';

import { GAME_CATALOG_DEFAULTS } from '../../games/game-catalog.defaults';
import { PrismaService } from '../database/prisma.service';

import { MeiliClientService } from './meili.client';
import {
  SEARCH_HIT_TYPE_TO_MEILI_INDEX,
  type MeiliIndexKey,
  type MeiliSearchDocument,
} from './meili.types';

/**
 * Builds Meilisearch documents from database rows and applies upsert/delete.
 */
@Injectable()
export class SearchIndexService {
  private readonly games: PrismaGameRepository;
  private readonly users: PrismaUserRepository;
  private readonly posts: PrismaPostRepository;
  private readonly reviews: PrismaReviewRepository;
  private readonly collections: PrismaCollectionRepository;
  private readonly tierLists: PrismaTierListRepository;
  private readonly communities: PrismaCommunityRepository;
  private readonly events: PrismaEventRepository;

  constructor(
    private readonly prisma: PrismaService,
    private readonly meili: MeiliClientService,
  ) {
    this.games = new PrismaGameRepository(this.prisma);
    this.users = new PrismaUserRepository(this.prisma);
    this.posts = new PrismaPostRepository(this.prisma);
    this.reviews = new PrismaReviewRepository(this.prisma);
    this.collections = new PrismaCollectionRepository(this.prisma);
    this.tierLists = new PrismaTierListRepository(this.prisma);
    this.communities = new PrismaCommunityRepository(this.prisma);
    this.events = new PrismaEventRepository(this.prisma);
  }

  async upsert(type: SearchHitType, id: string): Promise<void> {
    if (!this.meili.isAvailable()) {
      return;
    }
    const document = await this.buildDocument(type, id);
    if (document === null) {
      await this.delete(type, id);
      return;
    }
    const key = SEARCH_HIT_TYPE_TO_MEILI_INDEX[type];
    await this.meili.upsertDocuments(key, [document]);
  }

  /**
   * D3.25.1 — batch upsert for `SearchRepairService`. One `findMany` and one
   * Meili call per batch instead of one round-trip per row. Required for
   * `pnpm repair:index` to complete against real data volumes — the
   * per-row path timed out against this project's own seed data
   * (500k+ reviews) during D3.25.1 verification.
   */
  async upsertMany(type: SearchHitType, ids: readonly string[]): Promise<number> {
    if (!this.meili.isAvailable() || ids.length === 0) {
      return 0;
    }
    const documents = await this.buildDocuments(type, ids);
    if (documents.length === 0) {
      return 0;
    }
    const key = SEARCH_HIT_TYPE_TO_MEILI_INDEX[type];
    await this.meili.upsertDocuments(key, documents);
    return documents.length;
  }

  async delete(type: SearchHitType, id: string): Promise<void> {
    if (!this.meili.isAvailable()) {
      return;
    }
    const key = SEARCH_HIT_TYPE_TO_MEILI_INDEX[type];
    await this.meili.deleteDocument(key, id);
  }

  meiliDocumentToHitRecord(document: MeiliSearchDocument): SearchHitRecord {
    const orderedAt = new Date(document.orderedAt);
    switch (document.type) {
      case 'game':
        return {
          type: 'game',
          id: document.id,
          orderedAt,
          game: {
            id: document.id,
            title: document.title ?? '',
            slug: document.slug ?? '',
            releaseDate: null,
            featured: false,
            popularity: 0,
            franchiseId: null,
            createdAt: orderedAt,
            updatedAt: orderedAt,
            ...GAME_CATALOG_DEFAULTS,
            // D3.25 — real catalog fields carried through from the Meili
            // document so a search hit is a usable card, not a bare title.
            coverKey: document.coverKey ?? null,
            summary: document.description ?? null,
          },
          genres: document.genres ?? [],
        };
      case 'user':
        return {
          type: 'user',
          id: document.id,
          orderedAt,
          user: {
            id: document.id,
            handle: document.handle ?? '',
            displayName: document.displayName ?? '',
            bio: null,
            avatarKey: null,
            bannerKey: null,
            avatarBlurhash: null,
            avatarVariants: null,
            bannerBlurhash: null,
            bannerVariants: null,
            privacyId: null,
            // 12.4c — a search hit carries none of these and must not: a real
            // name, a birth date and a country are not search-index material.
            // `null` here is the same placeholder as `bio`/`avatarKey` above,
            // not a claim that the account lacks them.
            firstName: null,
            lastName: null,
            birthDate: null,
            countryCode: null,
            creatorFeatured: false,
            accountKind: 'individual',
            // Reconstructed from a Meili hit, which never carries this
            // column — placeholder only, and `toUserPublicResponse` never
            // reads it (`cardNumber` is exposed on `ProfileHeroResponse`,
            // not `UserPublicResponse`).
            cardNumber: 0,
            createdAt: orderedAt,
            updatedAt: orderedAt,
            deletedAt: null,
          },
        };
      case 'post':
        return {
          type: 'post',
          id: document.id,
          orderedAt,
          post: {
            id: document.id,
            authorId: document.authorId ?? '',
            gameId: null,
            communityId: null,
            body: document.body ?? '',
            visibility: document.visibility ?? 'public',
            postKind: 'text',
            containsSpoilers: false,
            pinnedAt: null,
            createdAt: orderedAt,
            updatedAt: orderedAt,
            deletedAt: null,
          },
        };
      case 'review':
        return {
          type: 'review',
          id: document.id,
          orderedAt,
          review: {
            id: document.id,
            authorId: document.authorId ?? '',
            gameId: 'game',
            rating: 0,
            body: document.body ?? null,
            containsSpoilers: false,
            visibility: document.visibility ?? 'public',
            version: 1,
            createdAt: orderedAt,
            updatedAt: orderedAt,
            deletedAt: null,
          },
          game: {
            id: 'game',
            title: document.gameTitle ?? '',
            slug: '',
            coverKey: null,
            releaseDate: null,
            featured: false,
            popularity: 0,
            franchiseId: null,
            createdAt: orderedAt,
            updatedAt: orderedAt,
            ...GAME_CATALOG_DEFAULTS,
          },
        };
      case 'collection':
        return {
          type: 'collection',
          id: document.id,
          orderedAt,
          collection: {
            id: document.id,
            ownerId: document.ownerId ?? '',
            title: document.title ?? '',
            description: document.description ?? null,
            visibility: document.visibility ?? 'public',
            type: 'manual',
            ruleKey: null,
            bannerKey: null,
            coverKey: null,
            color: null,
            tags: [],
            version: 1,
            createdAt: orderedAt,
            updatedAt: orderedAt,
            deletedAt: null,
          },
        };
      case 'tier-list':
        return {
          type: 'tier-list',
          id: document.id,
          orderedAt,
          tierList: {
            id: document.id,
            ownerId: document.ownerId ?? '',
            title: document.title ?? '',
            visibility: document.visibility ?? 'public',
            version: 1,
            createdAt: orderedAt,
            updatedAt: orderedAt,
            deletedAt: null,
          },
        };
      case 'community':
        return {
          type: 'community',
          id: document.id,
          orderedAt,
          community: {
            id: document.id,
            name: document.name ?? '',
            slug: '',
            description: document.description ?? null,
            visibility: document.visibility ?? 'public',
            avatarKey: null,
            bannerKey: null,
            avatarBlurhash: null,
            avatarVariants: null,
            bannerBlurhash: null,
            bannerVariants: null,
            joinType: 'public' as const,
            kind: 'games' as const,
            tags: [],
            createdAt: orderedAt,
            updatedAt: orderedAt,
            deletedAt: null,
          },
        };
      case 'event':
        return {
          type: 'event',
          id: document.id,
          orderedAt,
          event: {
            id: document.id,
            title: document.title ?? '',
            kind: (document.kind ?? 'community') as
              'game' | 'community' | 'tournament' | 'seasonal',
            description: null,
            gameId: null,
            communityId: null,
            startsAt: orderedAt,
            endsAt: null,
            createdAt: orderedAt,
            updatedAt: orderedAt,
            deletedAt: null,
          },
        };
    }
  }

  /** D3.25.1 — batch counterpart of `buildDocument`; one query per type, not one per row. */
  private async buildDocuments(
    type: SearchHitType,
    ids: readonly string[],
  ): Promise<MeiliSearchDocument[]> {
    const idList = [...ids];
    switch (type) {
      case 'game': {
        const games = await this.prisma.game.findMany({ where: { id: { in: idList } } });
        const genreLinks = await this.prisma.gameGenre.findMany({
          where: { gameId: { in: idList } },
          include: { genre: true },
        });
        const genresByGame = new Map<string, string[]>();
        for (const link of genreLinks) {
          const list = genresByGame.get(link.gameId) ?? [];
          list.push(link.genre.name);
          genresByGame.set(link.gameId, list);
        }
        return games.map((game) => ({
          id: game.id,
          type,
          orderedAt: game.createdAt.toISOString(),
          title: game.title,
          slug: game.slug,
          description: game.summary ?? game.description ?? undefined,
          coverKey: game.coverKey ?? undefined,
          genres: genresByGame.get(game.id) ?? [],
        }));
      }
      case 'user': {
        const users = await this.prisma.user.findMany({
          where: { id: { in: idList }, deletedAt: null },
        });
        return users.map((user) => ({
          id: user.id,
          type,
          orderedAt: user.createdAt.toISOString(),
          handle: user.handle,
          displayName: user.displayName,
        }));
      }
      case 'post': {
        const posts = await this.prisma.post.findMany({
          where: { id: { in: idList }, deletedAt: null },
        });
        return posts.map((post) => ({
          id: post.id,
          type,
          orderedAt: post.createdAt.toISOString(),
          visibility: post.visibility,
          authorId: post.authorId,
          body: post.body,
        }));
      }
      case 'review': {
        const reviews = await this.prisma.review.findMany({
          where: { id: { in: idList }, deletedAt: null },
        });
        const gameIds = [...new Set(reviews.map((review) => review.gameId))];
        const games = await this.prisma.game.findMany({
          where: { id: { in: gameIds } },
          select: { id: true, title: true },
        });
        const titleByGameId = new Map(games.map((game) => [game.id, game.title]));
        return reviews.map((review) => ({
          id: review.id,
          type,
          orderedAt: review.createdAt.toISOString(),
          visibility: review.visibility,
          authorId: review.authorId,
          body: review.body ?? undefined,
          gameTitle: titleByGameId.get(review.gameId),
        }));
      }
      case 'collection': {
        const collections = await this.prisma.collection.findMany({
          where: { id: { in: idList }, deletedAt: null },
        });
        return collections.map((collection) => ({
          id: collection.id,
          type,
          orderedAt: collection.createdAt.toISOString(),
          visibility: collection.visibility,
          ownerId: collection.ownerId,
          title: collection.title,
          description: collection.description ?? undefined,
        }));
      }
      case 'tier-list': {
        const tierLists = await this.prisma.tierList.findMany({
          where: { id: { in: idList }, deletedAt: null },
        });
        return tierLists.map((tierList) => ({
          id: tierList.id,
          type,
          orderedAt: tierList.createdAt.toISOString(),
          visibility: tierList.visibility,
          ownerId: tierList.ownerId,
          title: tierList.title,
        }));
      }
      case 'community': {
        const communities = await this.prisma.community.findMany({
          where: { id: { in: idList }, deletedAt: null },
        });
        return communities.map((community) => ({
          id: community.id,
          type,
          orderedAt: community.createdAt.toISOString(),
          visibility: community.visibility,
          name: community.name,
          description: community.description ?? undefined,
        }));
      }
      case 'event': {
        const events = await this.prisma.event.findMany({
          where: { id: { in: idList }, deletedAt: null },
        });
        return events.map((event) => ({
          id: event.id,
          type,
          orderedAt: event.createdAt.toISOString(),
          title: event.title,
          kind: event.kind,
        }));
      }
    }
  }

  private async buildDocument(
    type: SearchHitType,
    id: string,
  ): Promise<MeiliSearchDocument | null> {
    switch (type) {
      case 'game': {
        const game = await this.games.findById(id);
        if (game == null) {
          return null;
        }
        // D3.25 — cover and genres ride alongside the summary so a search hit
        // is a usable card, not just a matched title (docs/18_CATALOG/).
        const genreLinks = await this.prisma.gameGenre.findMany({
          where: { gameId: id },
          include: { genre: true },
        });
        return {
          id: game.id,
          type,
          orderedAt: game.createdAt.toISOString(),
          title: game.title,
          slug: game.slug,
          // D3.25.1 — catalog enrichment (summary/description) is now
          // searchable. Without this, reindexing after enrichment is a no-op:
          // the document never actually changes.
          description: game.summary ?? game.description ?? undefined,
          coverKey: game.coverKey ?? undefined,
          genres: genreLinks.map((link) => link.genre.name),
        };
      }
      case 'user': {
        const user = await this.users.findById(id);
        if (user == null || user.deletedAt != null) {
          return null;
        }
        return {
          id: user.id,
          type,
          orderedAt: user.createdAt.toISOString(),
          handle: user.handle,
          displayName: user.displayName,
        };
      }
      case 'post': {
        const post = await this.posts.findActiveById(id);
        if (post == null) {
          return null;
        }
        return {
          id: post.id,
          type,
          orderedAt: post.createdAt.toISOString(),
          visibility: post.visibility,
          authorId: post.authorId,
          body: post.body,
        };
      }
      case 'review': {
        const review = await this.reviews.findActiveById(id);
        if (review == null) {
          return null;
        }
        const game = await this.games.findById(review.gameId);
        return {
          id: review.id,
          type,
          orderedAt: review.createdAt.toISOString(),
          visibility: review.visibility,
          authorId: review.authorId,
          body: review.body ?? undefined,
          gameTitle: game?.title,
        };
      }
      case 'collection': {
        const collection = await this.collections.findActiveById(id);
        if (collection == null) {
          return null;
        }
        return {
          id: collection.id,
          type,
          orderedAt: collection.createdAt.toISOString(),
          visibility: collection.visibility,
          ownerId: collection.ownerId,
          title: collection.title,
          description: collection.description ?? undefined,
        };
      }
      case 'tier-list': {
        const tierList = await this.tierLists.findActiveById(id);
        if (tierList == null) {
          return null;
        }
        return {
          id: tierList.id,
          type,
          orderedAt: tierList.createdAt.toISOString(),
          visibility: tierList.visibility,
          ownerId: tierList.ownerId,
          title: tierList.title,
        };
      }
      case 'community': {
        const community = await this.communities.findActiveById(id);
        if (community == null) {
          return null;
        }
        return {
          id: community.id,
          type,
          orderedAt: community.createdAt.toISOString(),
          visibility: community.visibility,
          name: community.name,
          description: community.description ?? undefined,
        };
      }
      case 'event': {
        const event = await this.events.findActiveById(id);
        if (event == null) {
          return null;
        }
        return {
          id: event.id,
          type,
          orderedAt: event.createdAt.toISOString(),
          title: event.title,
          kind: event.kind,
        };
      }
    }
  }
}

export function meiliIndexKeyForType(type: SearchHitType): MeiliIndexKey {
  return SEARCH_HIT_TYPE_TO_MEILI_INDEX[type];
}
