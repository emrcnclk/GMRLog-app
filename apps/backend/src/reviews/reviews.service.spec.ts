import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  asFeedFanoutPublisher,
  createFakeFeedFanoutPublisher,
} from '../infrastructure/jobs/testing/fake-feed-fanout.publisher';
import {
  asSearchIndexPublisher,
  createFakeSearchIndexPublisher,
} from '../infrastructure/jobs/testing/fake-search-index.publisher';
import type { RequestIdentity } from '../auth/interfaces/identity';
import {
  createFakeFollowRepository,
  makeFollow,
  type FakeFollowRepository,
} from '../follows/testing/fake-repositories';

import { ReviewsService } from './reviews.service';
import {
  createFakeGameRepository,
  createFakeReviewRepository,
  createFakeUserRepository,
  makeGame,
  makeReview,
  makeUser,
  type FakeGameRepository,
  type FakeReviewRepository,
  type FakeUserRepository,
} from './testing/fake-repositories';

const player: RequestIdentity = { class: 'player', userId: 'user-1' };
const guest: RequestIdentity = { class: 'guest' };
const other: RequestIdentity = { class: 'player', userId: 'user-2' };

let reviews: FakeReviewRepository;
let games: FakeGameRepository;
let users: FakeUserRepository;
let follows: FakeFollowRepository;
let service: ReviewsService;

beforeEach(() => {
  users = createFakeUserRepository([
    makeUser({ id: 'user-1', handle: 'gamer', displayName: 'Gamer' }),
    makeUser({ id: 'user-2', handle: 'other', displayName: 'Other' }),
  ]);
  games = createFakeGameRepository([
    makeGame({ id: 'game-1', title: 'Hollow Knight', slug: 'hollow-knight' }),
    makeGame({ id: 'game-2', title: 'Celeste', slug: 'celeste' }),
  ]);
  reviews = createFakeReviewRepository();
  follows = createFakeFollowRepository();
  service = new ReviewsService(
    reviews,
    games,
    users,
    follows,
    asFeedFanoutPublisher(createFakeFeedFanoutPublisher()),
    asSearchIndexPublisher(createFakeSearchIndexPublisher()),
  );
});

describe('ReviewsService.createReview', () => {
  it('creates a public review with rating and spoiler defaults', async () => {
    const created = await service.createReview('user-1', {
      gameId: 'game-1',
      rating: 9,
      body: 'Masterpiece',
    });
    expect(created).toMatchObject({
      rating: 9,
      containsSpoilers: false,
      visibility: 'public',
      gameId: 'game-1',
      author: { id: 'user-1', handle: 'gamer' },
      game: { id: 'game-1', title: 'Hollow Knight' },
    });
  });

  it('enforces one active review per (author, game)', async () => {
    await service.createReview('user-1', { gameId: 'game-1', rating: 7 });
    await expect(
      service.createReview('user-1', { gameId: 'game-1', rating: 8 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('allows a second review after soft-delete', async () => {
    const first = await service.createReview('user-1', { gameId: 'game-1', rating: 5 });
    await service.deleteReview(first.id, 'user-1');
    const second = await service.createReview('user-1', { gameId: 'game-1', rating: 8 });
    expect(second.rating).toBe(8);
    expect(reviews.rows.size).toBe(2);
  });

  it('rejects an unknown game', async () => {
    await expect(
      service.createReview('user-1', { gameId: 'missing', rating: 5 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('ReviewsService visibility + spoilers', () => {
  it('persists containsSpoilers without filtering/blurring', async () => {
    const created = await service.createReview('user-1', {
      gameId: 'game-1',
      rating: 6,
      containsSpoilers: true,
      body: 'The knight is hollow',
    });
    expect(created.containsSpoilers).toBe(true);
    expect(created.body).toBe('The knight is hollow');
  });

  it('hides private reviews from guests and non-authors (fail-closed 404)', async () => {
    const created = await service.createReview('user-1', {
      gameId: 'game-1',
      rating: 4,
      visibility: 'private',
    });
    await expect(service.getReview(created.id, guest)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.getReview(created.id, other)).rejects.toBeInstanceOf(NotFoundException);
    const self = await service.getReview(created.id, player);
    expect(self.visibility).toBe('private');
  });

  it('hides followers visibility from non-followers and opens it for followers', async () => {
    const created = await service.createReview('user-1', {
      gameId: 'game-1',
      rating: 5,
      visibility: 'followers',
    });
    await expect(service.getReview(created.id, other)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.getReview(created.id, guest)).rejects.toBeInstanceOf(NotFoundException);

    follows.rows.set(
      'edge',
      makeFollow({ id: 'edge', followerId: 'user-2', followeeId: 'user-1' }),
    );
    const visible = await service.getReview(created.id, other);
    expect(visible.visibility).toBe('followers');
  });
});

describe('ReviewsService.update + delete', () => {
  it('updates rating, body, spoiler and visibility as author', async () => {
    const created = await service.createReview('user-1', { gameId: 'game-1', rating: 5 });
    const updated = await service.updateReview(created.id, 'user-1', {
      rating: 10,
      body: null,
      containsSpoilers: true,
      visibility: 'private',
    });
    expect(updated).toMatchObject({
      rating: 10,
      body: null,
      containsSpoilers: true,
      visibility: 'private',
    });
  });

  it('forbids non-authors from updating or deleting', async () => {
    const created = await service.createReview('user-1', { gameId: 'game-1', rating: 5 });
    await expect(service.updateReview(created.id, 'user-2', { rating: 1 })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(service.deleteReview(created.id, 'user-2')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('soft-deletes so active reads return not found', async () => {
    const created = await service.createReview('user-1', { gameId: 'game-1', rating: 5 });
    await service.deleteReview(created.id, 'user-1');
    await expect(service.getReview(created.id, player)).rejects.toBeInstanceOf(NotFoundException);
    expect(reviews.rows.get(created.id)?.deletedAt).toBeInstanceOf(Date);
  });
});

describe('ReviewsService.listGameReviews', () => {
  it('returns only visibility-permitted rows for the viewer', async () => {
    await service.createReview('user-1', { gameId: 'game-1', rating: 9, visibility: 'public' });
    reviews.rows.set(
      'private-1',
      makeReview({
        id: 'private-1',
        authorId: 'user-2',
        gameId: 'game-1',
        rating: 2,
        visibility: 'private',
      }),
    );
    const guestList = await service.listGameReviews('game-1', guest);
    expect(guestList).toHaveLength(1);
    expect(guestList[0]?.rating).toBe(9);
  });
});
