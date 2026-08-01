import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  asFeedFanoutPublisher,
  createFakeFeedFanoutPublisher,
} from '../infrastructure/jobs/testing/fake-feed-fanout.publisher';
import {
  createFakeBlockRepository,
  type FakeBlockRepository,
} from '../blocks/testing/fake-repositories';
import {
  createFakeNotificationRepository,
  type FakeNotificationRepository,
} from '../notifications/testing/fake-repositories';
import {
  createFakePostRepository,
  createFakeUserRepository,
  makePost,
  makeUser,
  type FakePostRepository,
  type FakeUserRepository,
} from '../posts/testing/fake-repositories';

import { QuotesService, mapQuoteObjectType } from './quotes.service';

interface FakeQuote {
  id: string;
  authorId: string;
  targetType: string;
  targetId: string;
  body: string;
  visibility: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

function createFakeQuoteRepository() {
  const rows = new Map<string, FakeQuote>();
  let n = 0;
  return {
    rows,
    create: (data: {
      author: { connect: { id: string } };
      targetType: string;
      targetId: string;
      body: string;
      visibility: string;
    }) => {
      n += 1;
      const row: FakeQuote = {
        id: `quote-${n}`,
        authorId: data.author.connect.id,
        targetType: data.targetType,
        targetId: data.targetId,
        body: data.body,
        visibility: data.visibility,
        createdAt: new Date('2026-07-30T12:00:00.000Z'),
        updatedAt: new Date('2026-07-30T12:00:00.000Z'),
        deletedAt: null,
      };
      rows.set(row.id, row);
      return Promise.resolve(row);
    },
  };
}

describe('QuotesService', () => {
  let quotes: ReturnType<typeof createFakeQuoteRepository>;
  let users: FakeUserRepository;
  let posts: FakePostRepository;
  let blocks: FakeBlockRepository;
  let notifications: FakeNotificationRepository;
  let feedFanout: ReturnType<typeof createFakeFeedFanoutPublisher>;
  let service: QuotesService;

  beforeEach(() => {
    quotes = createFakeQuoteRepository();
    users = createFakeUserRepository([
      makeUser({ id: 'user-1', handle: 'alice' }),
      makeUser({ id: 'user-2', handle: 'bob' }),
    ]);
    posts = createFakePostRepository([
      makePost({ id: 'post-1', authorId: 'user-2', body: 'Original' }),
    ]);
    blocks = createFakeBlockRepository();
    notifications = createFakeNotificationRepository();
    feedFanout = createFakeFeedFanoutPublisher();
    service = new QuotesService(
      quotes as never,
      users,
      posts,
      blocks,
      notifications,
      asFeedFanoutPublisher(feedFanout),
    );
  });

  it('creates a quote of a post and notifies the author', async () => {
    const result = await service.createQuote('user-1', {
      targetType: 'post',
      targetId: 'post-1',
      body: 'Agree completely',
    });
    expect(result).toMatchObject({
      targetType: 'post',
      targetId: 'post-1',
      body: 'Agree completely',
      author: { id: 'user-1' },
    });
    expect(notifications.rows.size).toBe(1);
    expect(feedFanout.calls).toHaveLength(1);
  });

  it('rejects quotes across a block', async () => {
    await blocks.create({
      blocker: { connect: { id: 'user-1' } },
      blocked: { connect: { id: 'user-2' } },
    });
    await expect(
      service.createQuote('user-1', {
        targetType: 'post',
        targetId: 'post-1',
        body: 'Nope',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects missing post targets', async () => {
    await expect(
      service.createQuote('user-1', {
        targetType: 'post',
        targetId: 'missing',
        body: 'Ghost',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('maps non-post targets without requiring post rows', async () => {
    const result = await service.createQuote('user-1', {
      targetType: 'review',
      targetId: 'review-1',
      body: 'Disagree',
      visibility: 'followers',
    });
    expect(result.targetType).toBe('review');
    expect(result.visibility).toBe('followers');
    expect(notifications.rows.size).toBe(0);
  });

  it('does not notify when quoting own post', async () => {
    posts.rows.set('post-own', makePost({ id: 'post-own', authorId: 'user-1', body: 'Mine' }));
    await service.createQuote('user-1', {
      targetType: 'guide',
      targetId: 'post-own',
      body: 'Self note',
    });
    expect(notifications.rows.size).toBe(0);
  });

  it('rejects deleted author', async () => {
    users.rows.set('gone', makeUser({ id: 'gone', handle: 'gone', deletedAt: new Date() }));
    await expect(
      service.createQuote('gone', {
        targetType: 'collection',
        targetId: 'c1',
        body: 'x',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('maps tier_list · achievement · collection object types for notifications', async () => {
    posts.rows.set(
      'post-2',
      makePost({ id: 'post-2', authorId: 'user-2', body: 'Shot', postKind: 'screenshot' }),
    );
    await service.createQuote('user-1', {
      targetType: 'screenshot',
      targetId: 'post-2',
      body: 'Nice shot',
    });
    expect([...notifications.rows.values()][0]?.objectType).toBe('post');

    notifications.rows.clear();
    for (const targetType of ['tier_list', 'achievement', 'collection'] as const) {
      const result = await service.createQuote('user-1', {
        targetType,
        targetId: `${targetType}-1`,
        body: 'note',
      });
      expect(result.targetType).toBe(targetType);
    }
  });
});

describe('mapQuoteObjectType', () => {
  it('projects every quote target onto a notification objectType', () => {
    expect(mapQuoteObjectType('review')).toBe('review');
    expect(mapQuoteObjectType('collection')).toBe('collection');
    expect(mapQuoteObjectType('tier_list')).toBe('tier_list');
    expect(mapQuoteObjectType('achievement')).toBe('achievement');
    expect(mapQuoteObjectType('post')).toBe('post');
    expect(mapQuoteObjectType('guide')).toBe('post');
    expect(mapQuoteObjectType('screenshot')).toBe('post');
  });
});
