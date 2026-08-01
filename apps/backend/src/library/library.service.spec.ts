import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  createFakeFriendshipRepository,
  makeFriendship,
  type FakeFriendshipRepository,
} from '../friends/testing/fake-repositories';
import type { PrismaService } from '../infrastructure/database/prisma.service';
import {
  asFeedFanoutPublisher,
  createFakeFeedFanoutPublisher,
} from '../infrastructure/jobs/testing/fake-feed-fanout.publisher';
import {
  createFakeNotificationRepository,
  type FakeNotificationRepository,
} from '../notifications/testing/fake-repositories';

import { LibraryService } from './library.service';
import {
  createFakeGameLogRepository,
  createFakeGameRepository,
  createFakeLibraryEntryRepository,
  createFakeWishlistPrisma,
  makeGame,
  makeLibraryEntry,
  type FakeGameLogRepository,
  type FakeGameRepository,
  type FakeLibraryEntryRepository,
  type FakeWishlistPrisma,
} from './testing/fake-repositories';

let entries: FakeLibraryEntryRepository;
let logs: FakeGameLogRepository;
let games: FakeGameRepository;
let prisma: FakeWishlistPrisma;
let feedFanout: ReturnType<typeof createFakeFeedFanoutPublisher>;
let friendships: FakeFriendshipRepository;
let notifications: FakeNotificationRepository;
let service: LibraryService;

beforeEach(() => {
  entries = createFakeLibraryEntryRepository();
  logs = createFakeGameLogRepository();
  games = createFakeGameRepository([
    makeGame({ id: 'game-1', title: 'Hollow Knight', slug: 'hollow-knight' }),
    makeGame({ id: 'game-2', title: 'Celeste', slug: 'celeste' }),
  ]);
  prisma = createFakeWishlistPrisma();
  feedFanout = createFakeFeedFanoutPublisher();
  friendships = createFakeFriendshipRepository();
  notifications = createFakeNotificationRepository();
  service = new LibraryService(
    entries,
    logs,
    games,
    asFeedFanoutPublisher(feedFanout),
    prisma as unknown as PrismaService,
    undefined,
    friendships,
    notifications,
  );
});

describe('LibraryService.getHub', () => {
  it('returns zeroed counts across the closed status vocabulary', async () => {
    expect(await service.getHub('user-1')).toEqual({
      counts: {
        owned: 0,
        playing: 0,
        completed: 0,
        wishlist: 0,
        backlog: 0,
        hidden: 0,
        dropped: 0,
      },
      total: 0,
    });
  });

  it('aggregates shelf counts for the owner', async () => {
    await service.upsertEntry('user-1', 'game-1', { status: 'playing' });
    await service.upsertEntry('user-1', 'game-2', { status: 'wishlist' });
    const hub = await service.getHub('user-1');
    expect(hub.counts.playing).toBe(1);
    expect(hub.counts.wishlist).toBe(1);
    expect(hub.total).toBe(2);
    expect(feedFanout.calls).toEqual([
      expect.objectContaining({
        kind: 'wishlist',
        objectId: 'game-2',
        objectType: 'game',
        actorId: 'user-1',
      }),
    ]);
  });
});

describe('LibraryService.upsertEntry', () => {
  it('creates a unique (user, game) relationship as manual source', async () => {
    const entry = await service.upsertEntry('user-1', 'game-1', {
      status: 'owned',
      note: 'Bought on sale',
    });
    expect(entry).toMatchObject({
      gameId: 'game-1',
      status: 'owned',
      source: 'manual',
      game: { id: 'game-1', title: 'Hollow Knight', slug: 'hollow-knight', coverUrl: null },
      wishlist: null,
    });
    expect(logs.rows.map((log) => log.kind)).toEqual(['status_change', 'note']);
  });

  it('ignores client steam_import and always writes manual on create', async () => {
    const entry = await service.upsertEntry('user-1', 'game-1', {
      status: 'playing',
      source: 'steam_import',
    });
    expect(entry.source).toBe('manual');
  });

  it('updates status and appends a status_change GameLog', async () => {
    await service.upsertEntry('user-1', 'game-1', { status: 'wishlist' });
    const updated = await service.upsertEntry('user-1', 'game-1', { status: 'playing' });
    expect(updated.status).toBe('playing');
    expect(updated.source).toBe('manual');
    expect(entries.rows.size).toBe(1);
    expect(logs.rows.filter((log) => log.kind === 'status_change')).toHaveLength(2);
  });

  it('preserves steam_import source on subsequent player updates', async () => {
    entries.rows.set(
      'entry-imported',
      makeLibraryEntry({
        id: 'entry-imported',
        userId: 'user-1',
        gameId: 'game-1',
        status: 'owned',
        source: 'steam_import',
      }),
    );
    const updated = await service.upsertEntry('user-1', 'game-1', { status: 'playing' });
    expect(updated.source).toBe('steam_import');
    expect(updated.status).toBe('playing');
  });

  it('enforces one entry per (user, game) through upsert', async () => {
    await service.upsertEntry('user-1', 'game-1', { status: 'owned' });
    await service.upsertEntry('user-1', 'game-1', { status: 'completed' });
    expect(entries.rows.size).toBe(1);
    expect([...(await service.listEntries('user-1'))]).toHaveLength(1);
  });

  it('rejects an unknown catalog game', async () => {
    await expect(
      service.upsertEntry('user-1', 'missing-game', { status: 'owned' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('LibraryService list/get/delete', () => {
  beforeEach(async () => {
    await service.upsertEntry('user-1', 'game-1', { status: 'playing' });
    await service.upsertEntry('user-1', 'game-2', { status: 'wishlist' });
  });

  it('filters shelf lists by status', async () => {
    const wishlist = await service.listEntries('user-1', { filter: { status: 'wishlist' } });
    expect(wishlist).toHaveLength(1);
    expect(wishlist[0]?.gameId).toBe('game-2');
  });

  it('reads a single relationship', async () => {
    const entry = await service.getEntry('user-1', 'game-1');
    expect(entry.status).toBe('playing');
    expect(entry.wishlist).toBeNull();
  });

  it('returns not_found for a missing relationship', async () => {
    await expect(service.getEntry('user-1', 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('hard-deletes the relationship', async () => {
    await service.deleteEntry('user-1', 'game-1');
    await expect(service.getEntry('user-1', 'game-1')).rejects.toBeInstanceOf(NotFoundException);
    expect(entries.rows.size).toBe(1);
  });
});

describe('LibraryService D3.22 Wishlist++', () => {
  it('upserts wishlist metadata with defaults then patches fields', async () => {
    await service.upsertEntry('user-1', 'game-2', { status: 'wishlist' });
    const created = await service.upsertWishlistMetadata('user-1', 'game-2', {
      priority: 'high',
      waitStatus: 'waiting_sale',
      notes: 'Steam sale',
    });
    expect(created.wishlist).toEqual({
      priority: 'high',
      waitStatus: 'waiting_sale',
      notes: 'Steam sale',
    });

    const patched = await service.upsertWishlistMetadata('user-1', 'game-2', {
      priority: 'must_play',
      notes: null,
    });
    expect(patched.wishlist).toEqual({
      priority: 'must_play',
      waitStatus: 'waiting_sale',
      notes: null,
    });
  });

  it('projects wishlist metadata on list and get', async () => {
    await service.upsertEntry('user-1', 'game-1', { status: 'owned' });
    await service.upsertWishlistMetadata('user-1', 'game-1', {
      priority: 'low',
      waitStatus: 'waiting_dlc',
    });

    const listed = await service.listEntries('user-1');
    const owned = listed.find((row) => row.gameId === 'game-1');
    expect(owned?.wishlist).toMatchObject({
      priority: 'low',
      waitStatus: 'waiting_dlc',
    });

    const detail = await service.getEntry('user-1', 'game-1');
    expect(detail.wishlist?.priority).toBe('low');
  });

  it('rejects wishlist meta for a missing library entry', async () => {
    await expect(
      service.upsertWishlistMetadata('user-1', 'game-1', { priority: 'medium' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('allows wishlist meta on owned entries and preserves shelf note separation', async () => {
    await service.upsertEntry('user-1', 'game-1', {
      status: 'owned',
      note: 'shelf note',
    });
    const result = await service.upsertWishlistMetadata('user-1', 'game-1', {
      notes: 'wishlist notes',
    });
    expect(result.wishlist?.notes).toBe('wishlist notes');
    expect(result.wishlist?.priority).toBe('medium');
    expect(result.wishlist?.waitStatus).toBe('none');
  });

  it('rejects an unknown catalog game', async () => {
    await expect(
      service.upsertEntry('user-1', 'missing-game', { status: 'owned' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('LibraryService friend_wishlist_play', () => {
  it('notifies friends who wishlisted the game when a friend starts playing it', async () => {
    friendships.friendships.set(
      'friendship-1',
      makeFriendship({ id: 'friendship-1', userLowId: 'user-1', userHighId: 'user-2' }),
    );
    entries.rows.set(
      'user-2:game-1',
      makeLibraryEntry({
        id: 'entry-friend',
        userId: 'user-2',
        gameId: 'game-1',
        status: 'wishlist',
      }),
    );

    await service.upsertEntry('user-1', 'game-1', { status: 'playing' });

    const notifs = [...notifications.rows.values()];
    expect(notifs).toHaveLength(1);
    expect(notifs[0]).toMatchObject({
      recipientId: 'user-2',
      kind: 'friend_wishlist_play',
      objectType: 'game',
      objectId: 'game-1',
    });
  });

  it('does not notify non-friends or non-wishlisted friends', async () => {
    entries.rows.set(
      'user-3:game-1',
      makeLibraryEntry({
        id: 'entry-stranger',
        userId: 'user-3',
        gameId: 'game-1',
        status: 'wishlist',
      }),
    );
    friendships.friendships.set(
      'friendship-2',
      makeFriendship({ id: 'friendship-2', userLowId: 'user-1', userHighId: 'user-4' }),
    );
    entries.rows.set(
      'user-4:game-1',
      makeLibraryEntry({
        id: 'entry-friend-owned',
        userId: 'user-4',
        gameId: 'game-1',
        status: 'owned',
      }),
    );

    await service.upsertEntry('user-1', 'game-1', { status: 'playing' });

    expect([...notifications.rows.values()]).toHaveLength(0);
  });

  it('does not notify on non-playing status transitions', async () => {
    friendships.friendships.set(
      'friendship-1',
      makeFriendship({ id: 'friendship-1', userLowId: 'user-1', userHighId: 'user-2' }),
    );
    entries.rows.set(
      'user-2:game-1',
      makeLibraryEntry({
        id: 'entry-friend',
        userId: 'user-2',
        gameId: 'game-1',
        status: 'wishlist',
      }),
    );

    await service.upsertEntry('user-1', 'game-1', { status: 'owned' });

    expect([...notifications.rows.values()]).toHaveLength(0);
  });
});

describe('LibraryService D3.22 Wishlist++ swallow failures', () => {
  it('swallows achievement recalculation failures after wishlist upsert', async () => {
    const failingAchievements = {
      recalculate: async () => {
        throw new Error('recalc failed');
      },
    };
    const withAchievements = new LibraryService(
      entries,
      logs,
      games,
      asFeedFanoutPublisher(feedFanout),
      prisma as unknown as PrismaService,
      failingAchievements as never,
    );
    await withAchievements.upsertEntry('user-1', 'game-1', { status: 'owned' });
    await expect(
      withAchievements.upsertWishlistMetadata('user-1', 'game-1', { priority: 'high' }),
    ).resolves.toMatchObject({ wishlist: { priority: 'high' } });
  });
});
