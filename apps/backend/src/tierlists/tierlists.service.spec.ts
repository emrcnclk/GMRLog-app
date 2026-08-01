import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';

import type { RequestIdentity } from '../auth/interfaces/identity';
import {
  createFakeFollowRepository,
  makeFollow,
  type FakeFollowRepository,
} from '../follows/testing/fake-repositories';

import { TierSlotService } from './tier-slot.service';
import { TierListsService } from './tierlists.service';
import {
  createFakeGameRepository,
  createFakeTierListRepository,
  createFakeTierSlotRepository,
  createFakeUserRepository,
  makeGame,
  makeUser,
  type FakeGameRepository,
  type FakeTierListRepository,
  type FakeTierSlotRepository,
  type FakeUserRepository,
} from './testing/fake-repositories';

const player: RequestIdentity = { class: 'player', userId: 'user-1' };
const guest: RequestIdentity = { class: 'guest' };
const other: RequestIdentity = { class: 'player', userId: 'user-2' };

let tierLists: FakeTierListRepository;
let slots: FakeTierSlotRepository;
let games: FakeGameRepository;
let users: FakeUserRepository;
let follows: FakeFollowRepository;
let tierListsService: TierListsService;
let slotService: TierSlotService;

beforeEach(() => {
  users = createFakeUserRepository([
    makeUser({ id: 'user-1', handle: 'gamer' }),
    makeUser({ id: 'user-2', handle: 'other' }),
  ]);
  games = createFakeGameRepository([
    makeGame({ id: 'game-1', title: 'Hollow Knight', slug: 'hollow-knight' }),
    makeGame({ id: 'game-2', title: 'Celeste', slug: 'celeste' }),
    makeGame({ id: 'game-3', title: 'Hades', slug: 'hades' }),
  ]);
  tierLists = createFakeTierListRepository();
  slots = createFakeTierSlotRepository();
  follows = createFakeFollowRepository();
  tierListsService = new TierListsService(tierLists, slots, users, games, follows);
  slotService = new TierSlotService(tierLists, slots, games, tierListsService);
});

describe('TierListsService', () => {
  it('creates a public tier list and lists own index', async () => {
    const created = await tierListsService.createTierList('user-1', { title: 'S-tier culture' });
    expect(created).toMatchObject({
      title: 'S-tier culture',
      visibility: 'public',
      owner: { id: 'user-1' },
      slots: [],
    });
    expect(await tierListsService.listOwn('user-1')).toHaveLength(1);
  });

  it('hides private tier lists from guests and non-owners', async () => {
    const created = await tierListsService.createTierList('user-1', {
      title: 'Secret',
      visibility: 'private',
    });
    await expect(tierListsService.getTierList(created.id, guest)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(tierListsService.getTierList(created.id, other)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(tierListsService.getTierList(created.id, player)).resolves.toMatchObject({
      id: created.id,
    });
  });

  it('resolves followers visibility via FollowRepository.exists', async () => {
    const created = await tierListsService.createTierList('user-1', {
      title: 'Circle',
      visibility: 'followers',
    });
    await expect(tierListsService.getTierList(created.id, other)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    follows.rows.set(
      'edge',
      makeFollow({ id: 'edge', followerId: 'user-2', followeeId: 'user-1' }),
    );
    await expect(tierListsService.getTierList(created.id, other)).resolves.toMatchObject({
      visibility: 'followers',
    });
  });

  it('enforces ownership on update and soft-delete', async () => {
    const created = await tierListsService.createTierList('user-1', { title: 'Mine' });
    await expect(
      tierListsService.updateTierList(created.id, 'user-2', { title: 'Hack' }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    await tierListsService.deleteTierList(created.id, 'user-1');
    expect(await tierLists.findActiveById(created.id)).toBeNull();
  });
});

describe('TierSlotService', () => {
  it('replaces the board preserving slot and game order, allowing empty tiers', async () => {
    const created = await tierListsService.createTierList('user-1', { title: 'Board' });
    const replaced = await slotService.replaceSlots(created.id, 'user-1', {
      slots: [
        { label: 'S', gameIds: ['game-2', 'game-1'] },
        { label: 'A', gameIds: [] },
        { label: 'B', gameIds: ['game-3'] },
      ],
    });
    expect(replaced.slots.map((s) => s.label)).toEqual(['S', 'A', 'B']);
    expect(replaced.slots[0]?.games.map((g) => g.gameId)).toEqual(['game-2', 'game-1']);
    expect(replaced.slots[1]?.games).toEqual([]);
    expect(replaced.slots[2]?.games.map((g) => g.gameId)).toEqual(['game-3']);
  });

  it('rejects duplicate games, missing games, and non-owner replace', async () => {
    const created = await tierListsService.createTierList('user-1', { title: 'Dup' });

    await expect(
      slotService.replaceSlots(created.id, 'user-1', {
        slots: [
          { label: 'S', gameIds: ['game-1'] },
          { label: 'A', gameIds: ['game-1'] },
        ],
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    await expect(
      slotService.replaceSlots(created.id, 'user-1', {
        slots: [{ label: 'S', gameIds: ['missing'] }],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    await expect(
      slotService.replaceSlots(created.id, 'user-2', {
        slots: [{ label: 'S', gameIds: ['game-1'] }],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
