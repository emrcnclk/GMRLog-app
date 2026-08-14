import type { CollectionRepository, TierListRepository } from '@gmrlog/database';
import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';

import type { RequestIdentity } from '../auth/interfaces/identity';
import { createFakeBlockRepository, makeBlock } from '../blocks/testing/fake-repositories';
import {
  createFakeCommunityMemberRepository,
  createFakeCommunityRepository,
  makeCommunity,
  makeCommunityMember,
  type FakeCommunityMemberRepository,
  type FakeCommunityRepository,
} from '../communities/testing/fake-repositories';
import {
  createFakeEventParticipationRepository,
  createFakeEventRepository,
  makeEvent,
  makeParticipation,
  type FakeEventParticipationRepository,
  type FakeEventRepository,
} from '../events/testing/fake-repositories';
import { createFakeFollowRepository } from '../follows/testing/fake-repositories';
import {
  createFakeLibraryEntryRepository,
  makeLibraryEntry,
} from '../library/testing/fake-repositories';
import {
  createFakeGameRepository,
  createFakePostRepository,
  createFakeUserRepository,
  makeGame,
  makePost,
  makeUser,
  type FakeGameRepository,
  type FakePostRepository,
  type FakeUserRepository,
} from '../posts/testing/fake-repositories';
import { createFakeReviewRepository, makeReview } from '../reviews/testing/fake-repositories';

import { GameHubService } from './game-hub.service';
import {
  createFakeGameHubCollectionRepository,
  createFakeGameHubTierListRepository,
  makeCollection,
  makeTierList,
} from './testing/fake-repositories';

const guest: RequestIdentity = { class: 'guest' };
const viewer: RequestIdentity = { class: 'player', userId: 'viewer-1' };

let games: FakeGameRepository;
let posts: FakePostRepository;
let reviews: ReturnType<typeof createFakeReviewRepository>;
let collections: ReturnType<typeof createFakeGameHubCollectionRepository>;
let tierLists: ReturnType<typeof createFakeGameHubTierListRepository>;
let events: FakeEventRepository;
let eventParticipations: FakeEventParticipationRepository;
let communities: FakeCommunityRepository;
let communityMembers: FakeCommunityMemberRepository;
let library: ReturnType<typeof createFakeLibraryEntryRepository>;
let users: FakeUserRepository;
let follows: ReturnType<typeof createFakeFollowRepository>;
let blocks: ReturnType<typeof createFakeBlockRepository>;
let service: GameHubService;

beforeEach(() => {
  games = createFakeGameRepository([makeGame({ id: 'game-1', title: 'Hollow Knight' })]);
  posts = createFakePostRepository([
    makePost({
      id: 'post-screenshot',
      gameId: 'game-1',
      authorId: 'author-1',
      postKind: 'screenshot',
      createdAt: new Date('2026-01-05T00:00:00.000Z'),
    }),
    makePost({
      id: 'post-guide',
      gameId: 'game-1',
      authorId: 'author-1',
      postKind: 'guide',
      createdAt: new Date('2026-01-04T00:00:00.000Z'),
    }),
    makePost({
      id: 'post-private',
      gameId: 'game-1',
      authorId: 'author-1',
      postKind: 'screenshot',
      visibility: 'private',
      createdAt: new Date('2026-01-03T00:00:00.000Z'),
    }),
    makePost({
      id: 'post-community',
      gameId: 'game-1',
      authorId: 'author-1',
      communityId: 'community-posted',
      createdAt: new Date('2026-01-02T00:00:00.000Z'),
    }),
  ]);
  reviews = createFakeReviewRepository([
    makeReview({
      id: 'review-1',
      gameId: 'game-1',
      authorId: 'author-2',
      createdAt: new Date('2026-01-06T00:00:00.000Z'),
    }),
  ]);
  collections = createFakeGameHubCollectionRepository([
    makeCollection({ id: 'collection-1', ownerId: 'author-1', title: 'Metroidvanias' }),
  ]);
  tierLists = createFakeGameHubTierListRepository([
    makeTierList({ id: 'tier-1', ownerId: 'author-1', title: 'My Ranks' }),
  ]);
  events = createFakeEventRepository([
    makeEvent({
      id: 'event-1',
      title: 'Charm Run',
      gameId: 'game-1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    }),
  ]);
  eventParticipations = createFakeEventParticipationRepository([
    makeParticipation({ id: 'p-host', eventId: 'event-1', userId: 'author-3', state: 'hosting' }),
  ]);
  communities = createFakeCommunityRepository([
    makeCommunity({ id: 'community-named', name: 'Hollow Knight Fans' }),
    makeCommunity({ id: 'community-posted', name: 'Metroidvania Central' }),
    makeCommunity({ id: 'community-unrelated', name: 'Racing Sim Club' }),
  ]);
  communityMembers = createFakeCommunityMemberRepository([
    makeCommunityMember({ id: 'm-1', communityId: 'community-named', userId: 'author-1' }),
    makeCommunityMember({ id: 'm-2', communityId: 'community-posted', userId: 'author-1' }),
    makeCommunityMember({ id: 'm-3', communityId: 'community-posted', userId: 'author-2' }),
  ]);
  library = createFakeLibraryEntryRepository([
    makeLibraryEntry({ id: 'lib-1', userId: 'author-1', gameId: 'game-1', status: 'playing' }),
    makeLibraryEntry({ id: 'lib-2', userId: 'author-2', gameId: 'game-1', status: 'completed' }),
  ]);
  users = createFakeUserRepository([
    makeUser({ id: 'author-1', handle: 'author-one' }),
    makeUser({ id: 'author-2', handle: 'author-two' }),
    makeUser({ id: 'author-3', handle: 'host' }),
    makeUser({ id: 'viewer-1', handle: 'viewer' }),
  ]);
  follows = createFakeFollowRepository();
  blocks = createFakeBlockRepository();

  service = new GameHubService(
    games,
    posts,
    reviews,
    collections as unknown as CollectionRepository,
    tierLists as unknown as TierListRepository,
    events,
    eventParticipations,
    communities,
    communityMembers,
    library,
    users,
    follows,
    blocks,
  );
});

describe('GameHubService.getHub', () => {
  it('aggregates tab counts across posts · reviews · collections · tier lists · events · communities · players', async () => {
    const hub = await service.getHub('game-1', guest);

    expect(hub).toMatchObject({
      gameId: 'game-1',
      title: 'Hollow Knight',
      tabCounts: {
        reviews: 1,
        screenshots: 1,
        guides: 1,
        collections: 1,
        tierLists: 1,
        events: 1,
        players: 2,
      },
    });
    expect(hub.tabCounts.communities).toBeGreaterThanOrEqual(2);
  });

  it('throws NotFoundException for an unknown game', async () => {
    await expect(service.getHub('missing-game', guest)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('excludes players blocked by the viewer', async () => {
    blocks = createFakeBlockRepository([
      makeBlock({ blockerId: 'viewer-1', blockedId: 'author-2' }),
    ]);
    service = new GameHubService(
      games,
      posts,
      reviews,
      collections as unknown as CollectionRepository,
      tierLists as unknown as TierListRepository,
      events,
      eventParticipations,
      communities,
      communityMembers,
      library,
      users,
      follows,
      blocks,
    );

    const hub = await service.getHub('game-1', viewer);
    expect(hub.tabCounts.players).toBe(1);
  });
});

describe('GameHubService.getFeed', () => {
  it('merges posts · reviews · events into one timeline sorted newest first', async () => {
    const page = await service.getFeed('game-1', guest);

    expect(page.items.map((item) => item.id)).toEqual([
      'review-1',
      'post-screenshot',
      'post-guide',
      'post-community',
      'event-1',
    ]);
    expect(page.items[0]).toMatchObject({ kind: 'review', feedItemKind: 'post_item' });
    expect(page.items.find((item) => item.id === 'event-1')).toMatchObject({
      kind: 'event',
      actor: { id: 'author-3' },
    });
  });

  it('excludes non-public posts for guests', async () => {
    const page = await service.getFeed('game-1', guest);
    expect(page.items.some((item) => item.id === 'post-private')).toBe(false);
  });

  it('paginates with a cursor', async () => {
    const first = await service.getFeed('game-1', guest, { limit: 2 });
    expect(first.items).toHaveLength(2);
    expect(first.hasMore).toBe(true);
    expect(first.cursor.next).not.toBeNull();

    const next = await service.getFeed('game-1', guest, {
      limit: 2,
      cursor: first.cursor.next ?? undefined,
    });
    expect(next.items.map((item) => item.id)).toEqual(['post-guide', 'post-community']);
    expect(next.hasMore).toBe(true);
  });
});

describe('GameHubService screenshots / guides tabs', () => {
  it('lists only screenshot posts, honoring visibility', async () => {
    const result = await service.listScreenshots('game-1', guest);
    expect(result.map((post) => post.id)).toEqual(['post-screenshot']);
  });

  it('lists only guide posts', async () => {
    const result = await service.listGuides('game-1', guest);
    expect(result.map((post) => post.id)).toEqual(['post-guide']);
  });
});

describe('GameHubService.listCollections / listTierLists', () => {
  it('projects owner-hydrated collection summaries', async () => {
    const result = await service.listCollections('game-1');
    expect(result).toEqual([
      expect.objectContaining({
        id: 'collection-1',
        title: 'Metroidvanias',
        owner: expect.objectContaining({ id: 'author-1' }),
      }),
    ]);
  });

  it('projects owner-hydrated tier list summaries', async () => {
    const result = await service.listTierLists('game-1');
    expect(result).toEqual([
      expect.objectContaining({
        id: 'tier-1',
        title: 'My Ranks',
        owner: expect.objectContaining({ id: 'author-1' }),
      }),
    ]);
  });
});

describe('GameHubService.listEvents', () => {
  it('includes viewer participation when authenticated', async () => {
    eventParticipations.rows.set(
      'p-viewer',
      makeParticipation({ id: 'p-viewer', eventId: 'event-1', userId: 'viewer-1', state: 'going' }),
    );
    const result = await service.listEvents('game-1', viewer);
    expect(result[0]?.viewerParticipation).toMatchObject({ state: 'going' });
  });

  it('omits viewer participation for guests', async () => {
    const result = await service.listEvents('game-1', guest);
    expect(result[0]?.viewerParticipation).toBeNull();
  });

  it('9.4 — reports attendeeCount (going/hosting only) and omits communityName for a gameless event', async () => {
    // Fixture seeds event-1 with one 'hosting' participation and no communityId.
    const result = await service.listEvents('game-1', guest);
    expect(result[0]?.attendeeCount).toBe(1);
    expect(result[0]?.communityName).toBeUndefined();
  });

  it('9.4 — reports 0 for an event with no attendees', async () => {
    eventParticipations.rows.clear();
    const result = await service.listEvents('game-1', guest);
    expect(result[0]?.attendeeCount).toBe(0);
  });
});

describe('GameHubService.listCommunities', () => {
  it('unions name-heuristic matches with communities that posted about the game', async () => {
    const result = await service.listCommunities('game-1');
    const ids = result.map((row) => row.id);
    expect(ids).toContain('community-named');
    expect(ids).toContain('community-posted');
    expect(ids).not.toContain('community-unrelated');
  });
});

describe('GameHubService.listPlayers', () => {
  it('returns library rows for the game', async () => {
    const result = await service.listPlayers('game-1', guest);
    expect(result.map((row) => row.user.id).sort()).toEqual(['author-1', 'author-2']);
  });

  it('excludes players blocked by the viewer', async () => {
    blocks = createFakeBlockRepository([
      makeBlock({ blockerId: 'viewer-1', blockedId: 'author-1' }),
    ]);
    service = new GameHubService(
      games,
      posts,
      reviews,
      collections as unknown as CollectionRepository,
      tierLists as unknown as TierListRepository,
      events,
      eventParticipations,
      communities,
      communityMembers,
      library,
      users,
      follows,
      blocks,
    );

    const result = await service.listPlayers('game-1', viewer);
    expect(result.map((row) => row.user.id)).toEqual(['author-2']);
  });
});
