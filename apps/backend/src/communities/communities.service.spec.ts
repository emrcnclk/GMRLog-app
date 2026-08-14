import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { FriendshipRepository, PostRepository } from '@gmrlog/database';

import { createFakeFollowRepository } from '../follows/testing/fake-repositories';
import type { RequestIdentity } from '../auth/interfaces/identity';
import {
  createFakeUserRepository,
  type FakeUserRepository,
} from '../users/testing/fake-repositories';

import {
  canChangeMemberRoles,
  canDeleteCommunity,
  canEditWiki,
  canManagePins,
} from './community-permissions';
import { CommunitiesService } from './communities.service';
import { makeActivityItem } from '../activity/testing/fake-repositories';
import {
  createFakeCommunityBadgeRepository,
  createFakeCommunityCommentRepository,
  createFakeCommunityEventParticipationRepository,
  createFakeCommunityEventRepository,
  createFakeCommunityMemberRepository,
  createFakeCommunityPinRepository,
  createFakeCommunityPostRepository,
  createFakeCommunityRepository,
  createFakeCommunityActivityRepository,
  createFakeCommunityWikiRepository,
  makeCommunity,
  makeCommunityMember,
  makeCommunityPin,
  makeUser,
  makeWikiPage,
  type FakeCommunityActivityRepository,
  type FakeCommunityBadgeRepository,
  type FakeCommunityCommentRepository,
  type FakeCommunityEventParticipationRepository,
  type FakeCommunityEventRepository,
  type FakeCommunityMemberRepository,
  type FakeCommunityPinRepository,
  type FakeCommunityPostRepository,
  type FakeCommunityRepository,
  type FakeCommunityWikiRepository,
} from './testing/fake-repositories';

const player: RequestIdentity = { class: 'player', userId: 'user-1' };
const guest: RequestIdentity = { class: 'guest' };

let communities: FakeCommunityRepository;
let members: FakeCommunityMemberRepository;
let communityActivities: FakeCommunityActivityRepository;
let users: FakeUserRepository;
let follows: ReturnType<typeof createFakeFollowRepository>;
let wiki: FakeCommunityWikiRepository;
let pins: FakeCommunityPinRepository;
let badges: FakeCommunityBadgeRepository;
let posts: FakeCommunityPostRepository;
let comments: FakeCommunityCommentRepository;
let events: FakeCommunityEventRepository;
let eventParticipations: FakeCommunityEventParticipationRepository;
let notifications!: { create: (data: unknown) => Promise<{ id: string }> };
/** 3b.1b — only `listFriendIds` is reached from the directory projection. */
let friendships!: FriendshipRepository;
let service: CommunitiesService;

function buildService(): CommunitiesService {
  return new CommunitiesService(
    communities,
    members,
    users,
    follows,
    communityActivities,
    wiki,
    pins,
    badges,
    posts as unknown as PostRepository,
    notifications as never,
    friendships,
    comments as never,
    events as never,
    eventParticipations as never,
    null,
    null,
  );
}

beforeEach(() => {
  follows = createFakeFollowRepository();
  notifications = { create: async () => ({ id: 'n1' }) as never };
  friendships = {
    listFriendIds: () => Promise.resolve([]),
  } as unknown as FriendshipRepository;
  users = createFakeUserRepository([
    makeUser({ id: 'user-1', handle: 'gamer', displayName: 'Gamer' }),
    makeUser({ id: 'user-2', handle: 'other', displayName: 'Other' }),
  ]);
  communities = createFakeCommunityRepository([
    makeCommunity({ id: 'community-1', name: 'Culture Room', slug: 'culture-room' }),
    makeCommunity({
      id: 'community-private',
      name: 'Hidden Room',
      slug: 'hidden-room',
      visibility: 'private',
    }),
  ]);
  members = createFakeCommunityMemberRepository([
    makeCommunityMember({
      id: 'member-owner',
      communityId: 'community-1',
      userId: 'user-1',
      role: 'owner',
    }),
    makeCommunityMember({
      id: 'member-private-owner',
      communityId: 'community-private',
      userId: 'user-2',
      role: 'owner',
    }),
  ]);
  communityActivities = createFakeCommunityActivityRepository();
  wiki = createFakeCommunityWikiRepository();
  pins = createFakeCommunityPinRepository();
  badges = createFakeCommunityBadgeRepository();
  posts = createFakeCommunityPostRepository();
  comments = createFakeCommunityCommentRepository();
  events = createFakeCommunityEventRepository();
  eventParticipations = createFakeCommunityEventParticipationRepository();
  service = buildService();
});

describe('Communities 2.0 permission matrix', () => {
  it('allows wiki edit and pin for moderator+ only', () => {
    expect(canEditWiki('member')).toBe(false);
    expect(canEditWiki('moderator')).toBe(true);
    expect(canEditWiki('admin')).toBe(true);
    expect(canEditWiki('owner')).toBe(true);

    expect(canManagePins('member')).toBe(false);
    expect(canManagePins('moderator')).toBe(true);
    expect(canManagePins('admin')).toBe(true);
    expect(canManagePins('owner')).toBe(true);
  });

  it('allows role changes for admin+ and delete for owner only', () => {
    expect(canChangeMemberRoles('member')).toBe(false);
    expect(canChangeMemberRoles('moderator')).toBe(false);
    expect(canChangeMemberRoles('admin')).toBe(true);
    expect(canChangeMemberRoles('owner')).toBe(true);

    expect(canDeleteCommunity('admin')).toBe(false);
    expect(canDeleteCommunity('owner')).toBe(true);
  });
});

describe('CommunitiesService.listCommunities', () => {
  it('lists public communities for guests', async () => {
    const listed = await service.listCommunities(guest);
    expect(listed.items.map((row) => row.id)).toEqual(['community-1']);
  });

  it('includes member private communities for authenticated viewers', async () => {
    const listed = await service.listCommunities({ class: 'player', userId: 'user-2' });
    expect(listed.items.map((row) => row.id).sort()).toEqual(['community-1', 'community-private']);
  });

  /**
   * 3b.1a. The directory used to return every discoverable row; a page is now
   * bounded and the cursor walks the same `updatedAt desc, id desc` order the
   * repository sorts by.
   */
  it('bounds the page and reports whether more remain', async () => {
    const page = await service.listCommunities({ class: 'player', userId: 'user-2' }, { limit: 1 });
    expect(page.items).toHaveLength(1);
    expect(page.limit).toBe(1);
    expect(page.hasMore).toBe(true);
    expect(page.cursor.next).not.toBeNull();
  });

  it('walks the cursor without repeating or dropping a row', async () => {
    const viewer = { class: 'player', userId: 'user-2' } as const;
    const first = await service.listCommunities(viewer, { limit: 1 });
    const next = first.cursor.next;
    expect(next).not.toBeNull();
    const second = await service.listCommunities(viewer, {
      limit: 1,
      ...(next === null ? {} : { cursor: next }),
    });

    const seen = [...first.items, ...second.items].map((row) => row.id);
    expect(new Set(seen).size).toBe(seen.length);
    expect(seen.sort()).toEqual(['community-1', 'community-private']);
    expect(second.hasMore).toBe(false);
    expect(second.cursor.next).toBeNull();
  });

  /** 3b.1e — §13's filter pills, applied server-side so a paginated page filters correctly. */
  it('filters the directory by kind, joined circles included', async () => {
    communities = createFakeCommunityRepository([
      ...communities.rows.values(),
      makeCommunity({
        id: 'community-cosplay',
        name: 'Cosplay Guild',
        slug: 'cosplay-guild',
        kind: 'cosplay',
      }),
    ]);
    // Give the extra row a real owner so it clears `HAS_OWNER`.
    members = createFakeCommunityMemberRepository([
      ...members.rows.values(),
      makeCommunityMember({
        id: 'member-cosplay-owner',
        communityId: 'community-cosplay',
        userId: 'user-2',
        role: 'owner',
      }),
    ]);
    service = buildService();

    const filtered = await service.listCommunities(guest, { kind: 'cosplay' });
    expect(filtered.items.map((row) => row.id)).toEqual(['community-cosplay']);

    const unfiltered = await service.listCommunities(guest);
    expect(unfiltered.items.map((row) => row.id).sort()).toEqual([
      'community-1',
      'community-cosplay',
    ]);
  });

  it('rejects a malformed cursor rather than returning page one', async () => {
    await expect(service.listCommunities(guest, { cursor: 'not-a-cursor' })).rejects.toThrow();
  });

  /**
   * 3b.1b — §13's "N friends here". Viewer-relative, so it sits beside
   * `viewerMembership` rather than in `counts`: the same circle reports a
   * different number to a different viewer, and nothing at all to a guest.
   */
  it('counts the viewer’s friends inside each circle', async () => {
    // `user-1` owns `community-1`; viewing as `user-2` with `user-1` as a
    // friend, that circle should report one friend and the one where they have
    // none should report zero — same page, same query, different rows.
    friendships = {
      listFriendIds: () => Promise.resolve(['user-1']),
    } as unknown as FriendshipRepository;
    service = buildService();

    const listed = await service.listCommunities({ class: 'player', userId: 'user-2' });
    expect(listed.items.find((row) => row.id === 'community-1')?.viewerFriendCount).toBe(1);
    expect(listed.items.find((row) => row.id === 'community-private')?.viewerFriendCount).toBe(0);
  });

  it('omits the friend count entirely for a guest', async () => {
    const listed = await service.listCommunities(guest);
    expect(listed.items[0]).not.toHaveProperty('viewerFriendCount');
  });

  it('reports zero rather than nothing when a signed-in viewer has no friends there', async () => {
    const listed = await service.listCommunities(player);
    expect(listed.items[0]?.viewerFriendCount).toBe(0);
  });
});

/**
 * 3b.1e — BACKEND_CHANGES.md §6. `kind` is always present (the DB column is
 * required); `postsToday`/`activeNow` are computed, not stored, so every case
 * here fixes the clock rather than seeding a timestamp column.
 */
describe('CommunitiesService activity signal (3b.1e)', () => {
  const now = new Date('2026-01-02T10:00:00.000Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('carries the required kind on every projected community', async () => {
    const listed = await service.listCommunities(guest);
    expect(listed.items[0]?.kind).toBe('games');
  });

  it('reports zero/false, not an absent field, for a circle with no activity', async () => {
    const listed = await service.listCommunities(guest);
    expect(listed.items[0]?.postsToday).toBe(0);
    expect(listed.items[0]?.activeNow).toBe(false);
  });

  it('counts a recent post toward both postsToday and activeNow', async () => {
    communityActivities = createFakeCommunityActivityRepository([
      {
        communityId: 'community-1',
        row: {
          communityActivityId: 'ca-1',
          activityItem: makeActivityItem({
            id: 'activity-1',
            kind: 'post',
            occurredAt: new Date('2026-01-02T09:00:00.000Z'), // 1h ago
          }),
          actor: null,
        },
      },
    ]);
    service = buildService();

    const listed = await service.listCommunities(guest);
    expect(listed.items[0]?.postsToday).toBe(1);
    expect(listed.items[0]?.activeNow).toBe(true);
  });

  it('keeps the post in postsToday but drops activeNow once it ages past the 3h window', async () => {
    communityActivities = createFakeCommunityActivityRepository([
      {
        communityId: 'community-1',
        row: {
          communityActivityId: 'ca-1',
          activityItem: makeActivityItem({
            id: 'activity-1',
            kind: 'post',
            occurredAt: new Date('2026-01-02T06:00:00.000Z'), // 4h ago, still today (UTC)
          }),
          actor: null,
        },
      },
    ]);
    service = buildService();

    const listed = await service.listCommunities(guest);
    expect(listed.items[0]?.postsToday).toBe(1);
    expect(listed.items[0]?.activeNow).toBe(false);
  });

  it('resets postsToday at UTC midnight, not a rolling 24h window', async () => {
    communityActivities = createFakeCommunityActivityRepository([
      {
        communityId: 'community-1',
        row: {
          communityActivityId: 'ca-1',
          activityItem: makeActivityItem({
            id: 'activity-1',
            kind: 'post',
            occurredAt: new Date('2026-01-01T23:00:00.000Z'), // 11h ago, yesterday (UTC)
          }),
          actor: null,
        },
      },
    ]);
    service = buildService();

    const listed = await service.listCommunities(guest);
    expect(listed.items[0]?.postsToday).toBe(0);
    expect(listed.items[0]?.activeNow).toBe(false);
  });

  it('ignores non-post activity kinds', async () => {
    communityActivities = createFakeCommunityActivityRepository([
      {
        communityId: 'community-1',
        row: {
          communityActivityId: 'ca-1',
          activityItem: makeActivityItem({
            id: 'activity-1',
            kind: 'community', // a role/badge-style event, not a member post
            occurredAt: new Date('2026-01-02T09:30:00.000Z'),
          }),
          actor: null,
        },
      },
    ]);
    service = buildService();

    const listed = await service.listCommunities(guest);
    expect(listed.items[0]?.postsToday).toBe(0);
    expect(listed.items[0]?.activeNow).toBe(false);
  });
});

describe('CommunitiesService.createCommunity', () => {
  it('creates community and owner membership with founder badge', async () => {
    const created = await service.createCommunity('user-1', {
      name: 'New Room',
      slug: 'new-room',
      visibility: 'public',
    });
    expect(created).toMatchObject({
      name: 'New Room',
      viewerMembership: { role: 'owner' },
      counts: { members: 1 },
    });
    expect([...badges.rows.values()].some((row) => row.kind === 'founder')).toBe(true);
  });

  it('rejects duplicate slug with 409', async () => {
    await expect(
      service.createCommunity('user-1', {
        name: 'Dup',
        slug: 'culture-room',
        visibility: 'public',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('CommunitiesService.updateCommunity', () => {
  it('allows owner patch', async () => {
    const updated = await service.updateCommunity('community-1', 'user-1', {
      name: 'Renamed Room',
    });
    expect(updated.name).toBe('Renamed Room');
  });

  it('returns 403 for non-member', async () => {
    await expect(
      service.updateCommunity('community-1', 'user-2', { name: 'Nope' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows admin to change joinType', async () => {
    members.rows.set(
      'member-admin',
      makeCommunityMember({
        id: 'member-admin',
        communityId: 'community-1',
        userId: 'user-2',
        role: 'admin',
      }),
    );
    const updated = await service.updateCommunity('community-1', 'user-2', {
      joinType: 'invite_only',
    });
    expect(communities.rows.get('community-1')?.joinType).toBe('invite_only');
    expect(updated.id).toBe('community-1');
  });

  it('rejects joinType change for non-admin members', async () => {
    members.rows.set(
      'member-2',
      makeCommunityMember({
        id: 'member-2',
        communityId: 'community-1',
        userId: 'user-2',
        role: 'member',
      }),
    );
    await expect(
      service.updateCommunity('community-1', 'user-2', { joinType: 'private' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects empty patch with no fields', async () => {
    await expect(service.updateCommunity('community-1', 'user-1', {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

describe('CommunitiesService.deleteCommunity', () => {
  it('soft-deletes for owner', async () => {
    await service.deleteCommunity('community-1', 'user-1');
    await expect(service.getCommunity('community-1', player)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns 403 for non-owner', async () => {
    await expect(service.deleteCommunity('community-1', 'user-2')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});

describe('CommunitiesService.getCommunity', () => {
  it('projects viewer membership and member counts for members', async () => {
    const detail = await service.getCommunity('community-1', player);
    expect(detail).toMatchObject({
      id: 'community-1',
      name: 'Culture Room',
      counts: { members: 1 },
      viewerMembership: { role: 'owner' },
    });
  });

  it('allows guests on public communities', async () => {
    const detail = await service.getCommunity('community-1', guest);
    expect(detail.viewerMembership).toBeNull();
    expect(detail.counts.members).toBe(1);
  });

  it('returns 404 for private communities when guest', async () => {
    await expect(service.getCommunity('community-private', guest)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns 404 for soft-deleted communities', async () => {
    await communities.softDelete('community-1');
    await expect(service.getCommunity('community-1', player)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('CommunitiesService.listMembers', () => {
  it('lists members oldest-first with roles and badges', async () => {
    members.rows.set(
      'member-2',
      makeCommunityMember({
        id: 'member-2',
        communityId: 'community-1',
        userId: 'user-2',
        role: 'member',
        joinedAt: new Date('2026-01-02T00:00:00.000Z'),
      }),
    );
    const listed = await service.listMembers('community-1', guest);
    expect(listed.map((row) => row.user.id)).toEqual(['user-1', 'user-2']);
    expect(listed[0]?.role).toBe('owner');
    expect(listed[1]?.role).toBe('member');
    expect(listed[0]?.badges).toEqual([]);
  });

  it('marks the top-N by leaderboard points as isContributor, everyone else false', async () => {
    members.rows.set(
      'member-2',
      makeCommunityMember({ id: 'member-2', communityId: 'community-1', userId: 'user-2' }),
    );
    posts = createFakeCommunityPostRepository(
      [],
      [{ id: 'post-1', communityId: 'community-1', authorId: 'user-2', postKind: 'guide' }],
    );
    service = buildService();

    const listed = await service.listMembers('community-1', guest);
    expect(listed.find((row) => row.user.id === 'user-2')?.isContributor).toBe(true);
    expect(listed.find((row) => row.user.id === 'user-1')?.isContributor).toBe(false);
  });
});

describe('CommunitiesService.getLeaderboard (7.1 / BACKEND_CHANGES.md §5)', () => {
  const DAY_MS = 24 * 60 * 60 * 1000;
  // Relative to the real clock, not a fixed date — a 90d-window fixture must
  // stay inside the window no matter when the suite actually runs.
  const withinWindow = new Date(Date.now() - 10 * DAY_MS);
  const outsideWindow = new Date(Date.now() - 200 * DAY_MS);

  beforeEach(() => {
    members.rows.set(
      'member-2',
      makeCommunityMember({ id: 'member-2', communityId: 'community-1', userId: 'user-2' }),
    );
  });

  it('weights posts, guides, replies and hosted events per §5, highest first', async () => {
    // user-1 (owner): one text post (1pt) + hosts one event (5pt) = 6.
    // user-2: one guide post (3pt) + one reply (1pt) = 4.
    posts = createFakeCommunityPostRepository(
      [],
      [
        {
          id: 'post-1',
          communityId: 'community-1',
          authorId: 'user-1',
          postKind: 'text',
          createdAt: withinWindow,
        },
        {
          id: 'post-2',
          communityId: 'community-1',
          authorId: 'user-2',
          postKind: 'guide',
          createdAt: withinWindow,
        },
      ],
    );
    comments = createFakeCommunityCommentRepository([
      { hostType: 'post', hostId: 'post-1', authorId: 'user-2', createdAt: withinWindow },
    ]);
    events = createFakeCommunityEventRepository([{ id: 'event-1', communityId: 'community-1' }]);
    eventParticipations = createFakeCommunityEventParticipationRepository([
      { eventId: 'event-1', userId: 'user-1', state: 'hosting', createdAt: withinWindow },
    ]);
    service = buildService();

    const board = await service.getLeaderboard('community-1', guest, {});
    expect(board.window).toBe('90d');
    expect(board.entries).toEqual([
      { rank: 1, user: expect.objectContaining({ id: 'user-1' }), points: 6 },
      { rank: 2, user: expect.objectContaining({ id: 'user-2' }), points: 4 },
    ]);
  });

  it('only counts activity inside the requested window', async () => {
    posts = createFakeCommunityPostRepository(
      [],
      [
        {
          id: 'post-old',
          communityId: 'community-1',
          authorId: 'user-2',
          postKind: 'text',
          createdAt: outsideWindow,
        },
      ],
    );
    service = buildService();

    const board = await service.getLeaderboard('community-1', guest, { window: '7d' });
    expect(board.entries).toEqual([]);
  });

  it('excludes deleted members and closes the rank gap', async () => {
    users.rows.set('user-1', makeUser({ id: 'user-1', deletedAt: new Date('2026-02-01') }));
    posts = createFakeCommunityPostRepository(
      [],
      [
        {
          id: 'post-1',
          communityId: 'community-1',
          authorId: 'user-1',
          postKind: 'text',
          createdAt: withinWindow,
        },
        {
          id: 'post-2',
          communityId: 'community-1',
          authorId: 'user-2',
          postKind: 'text',
          createdAt: withinWindow,
        },
      ],
    );
    service = buildService();

    const board = await service.getLeaderboard('community-1', guest, {});
    expect(board.entries).toHaveLength(1);
    expect(board.entries[0]).toEqual({
      rank: 1,
      user: expect.objectContaining({ id: 'user-2' }),
      points: 1,
    });
  });

  it('rejects a viewer who cannot read the community', async () => {
    communities.rows.set(
      'community-private',
      makeCommunity({
        id: 'community-private',
        name: 'Hidden Room',
        slug: 'hidden-room',
        visibility: 'private',
      }),
    );
    await expect(service.getLeaderboard('community-private', guest, {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('CommunitiesService membership', () => {
  it('joins with member role', async () => {
    await service.joinCommunity('community-1', 'user-2');
    expect(members.rows.size).toBe(3);
    const membership = [...members.rows.values()].find(
      (row) => row.userId === 'user-2' && row.communityId === 'community-1',
    );
    expect(membership?.role).toBe('member');
  });

  it('rejects duplicate join with 409', async () => {
    await expect(service.joinCommunity('community-1', 'user-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejects join when invite_only', async () => {
    communities.rows.set(
      'community-1',
      makeCommunity({
        id: 'community-1',
        name: 'Culture Room',
        slug: 'culture-room',
        joinType: 'invite_only',
      }),
    );
    await expect(service.joinCommunity('community-1', 'user-2')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects join when private', async () => {
    communities.rows.set(
      'community-1',
      makeCommunity({
        id: 'community-1',
        name: 'Culture Room',
        slug: 'culture-room',
        joinType: 'private',
      }),
    );
    await expect(service.joinCommunity('community-1', 'user-2')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects owner leave with 409', async () => {
    await expect(service.leaveCommunity('community-1', 'user-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('hard-deletes non-owner membership on leave', async () => {
    await service.joinCommunity('community-1', 'user-2');
    await service.leaveCommunity('community-1', 'user-2');
    const remaining = [...members.rows.values()].find(
      (row) => row.userId === 'user-2' && row.communityId === 'community-1',
    );
    expect(remaining).toBeUndefined();
  });

  it('returns 404 when leaving without membership', async () => {
    await expect(service.leaveCommunity('community-1', 'user-2')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects join on unknown community', async () => {
    await expect(service.joinCommunity('missing', 'user-2')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('CommunitiesService wiki upsert', () => {
  it('creates a wiki page for moderator+ and increments version on update', async () => {
    members.rows.set(
      'member-mod',
      makeCommunityMember({
        id: 'member-mod',
        communityId: 'community-1',
        userId: 'user-2',
        role: 'moderator',
      }),
    );

    const created = await service.upsertWikiPage('community-1', 'rules', 'user-2', {
      title: 'Rules',
      body: 'Be kind',
    });
    expect(created).toMatchObject({
      slug: 'rules',
      title: 'Rules',
      body: 'Be kind',
      version: 1,
    });

    const updated = await service.upsertWikiPage('community-1', 'rules', 'user-2', {
      title: 'Rules',
      body: 'Be kinder',
    });
    expect(updated.version).toBe(2);
    expect(updated.body).toBe('Be kinder');
  });

  it('rejects wiki edit for plain members', async () => {
    members.rows.set(
      'member-2',
      makeCommunityMember({
        id: 'member-2',
        communityId: 'community-1',
        userId: 'user-2',
        role: 'member',
      }),
    );
    await expect(
      service.upsertWikiPage('community-1', 'rules', 'user-2', {
        title: 'Rules',
        body: 'Nope',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lists and gets wiki pages for readable communities', async () => {
    wiki.rows.set(
      'wiki-1',
      makeWikiPage({
        id: 'wiki-1',
        communityId: 'community-1',
        slug: 'home',
        title: 'Home',
        body: 'Hello',
        updatedById: 'user-1',
      }),
    );
    const listed = await service.listWikiPages('community-1', guest);
    expect(listed).toHaveLength(1);
    const page = await service.getWikiPage('community-1', 'home', guest);
    expect(page.slug).toBe('home');
  });

  it('returns 404 for missing wiki pages', async () => {
    await expect(service.getWikiPage('community-1', 'missing', guest)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('CommunitiesService pins', () => {
  it('creates and deletes pins for moderator+', async () => {
    members.rows.set(
      'member-mod',
      makeCommunityMember({
        id: 'member-mod',
        communityId: 'community-1',
        userId: 'user-2',
        role: 'moderator',
      }),
    );
    const pin = await service.createPin('community-1', 'user-2', {
      objectType: 'post',
      objectId: 'post-99',
    });
    expect(pin.objectId).toBe('post-99');
    await service.deletePin('community-1', pin.id, 'user-2');
    expect(pins.rows.size).toBe(0);
  });

  it('rejects pin create for members', async () => {
    members.rows.set(
      'member-2',
      makeCommunityMember({
        id: 'member-2',
        communityId: 'community-1',
        userId: 'user-2',
        role: 'member',
      }),
    );
    await expect(
      service.createPin('community-1', 'user-2', { objectType: 'post', objectId: 'post-1' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lists pins and rejects duplicate · cap · missing delete', async () => {
    members.rows.set(
      'member-mod',
      makeCommunityMember({
        id: 'member-mod',
        communityId: 'community-1',
        userId: 'user-2',
        role: 'moderator',
      }),
    );
    posts.activeById.set('post-99', {
      id: 'post-99',
      authorId: 'user-1',
      deletedAt: null,
    });

    const created = await service.createPin('community-1', 'user-2', {
      objectType: 'post',
      objectId: 'post-99',
    });
    const listed = await service.listPins('community-1', guest);
    expect(listed.map((row) => row.id)).toEqual([created.id]);

    await expect(
      service.createPin('community-1', 'user-2', { objectType: 'post', objectId: 'post-99' }),
    ).rejects.toBeInstanceOf(ConflictException);

    for (let i = 0; i < 9; i += 1) {
      await service.createPin('community-1', 'user-2', {
        objectType: 'review',
        objectId: `review-${i}`,
      });
    }
    await expect(
      service.createPin('community-1', 'user-2', {
        objectType: 'review',
        objectId: 'review-overflow',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    await expect(service.deletePin('community-1', 'missing-pin', 'user-2')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.deletePin('community-1', created.id, 'user-1')).resolves.toBeUndefined();
  });

  it('rejects pin delete for plain members', async () => {
    members.rows.set(
      'member-2',
      makeCommunityMember({
        id: 'member-2',
        communityId: 'community-1',
        userId: 'user-2',
        role: 'member',
      }),
    );
    pins.rows.set(
      'pin-1',
      makeCommunityPin({
        id: 'pin-1',
        communityId: 'community-1',
        objectType: 'post',
        objectId: 'post-1',
        position: 0,
      }),
    );
    await expect(service.deletePin('community-1', 'pin-1', 'user-2')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});

describe('CommunitiesService badges', () => {
  it('lists badges and syncs role · top contributor badges', async () => {
    users.rows.set(
      'user-2',
      makeUser({ id: 'user-2', handle: 'other', displayName: 'Other', creatorFeatured: true }),
    );
    members.rows.set(
      'member-2',
      makeCommunityMember({
        id: 'member-2',
        communityId: 'community-1',
        userId: 'user-2',
        role: 'moderator',
      }),
    );
    posts.counts.set('community-1', [{ authorId: 'user-2', count: 5 }]);

    await service.syncBadgesForCommunity('community-1');
    const listed = await service.listBadges('community-1', guest);
    expect(listed.some((row) => row.kind === 'founder')).toBe(true);
    expect(listed.some((row) => row.kind === 'moderator')).toBe(true);
    expect(listed.some((row) => row.kind === 'verified_creator')).toBe(true);
    expect(listed.some((row) => row.kind === 'top_contributor')).toBe(true);
  });

  it('no-ops sync when community has no members', async () => {
    members.rows.clear();
    await expect(service.syncBadgesForCommunity('community-1')).resolves.toBeUndefined();
  });

  it('updates member roles and notifies on new badges', async () => {
    members.rows.set(
      'member-2',
      makeCommunityMember({
        id: 'member-2',
        communityId: 'community-1',
        userId: 'user-2',
        role: 'member',
      }),
    );
    const created = await service.updateMemberRole('community-1', 'user-1', 'user-2', {
      role: 'moderator',
    });
    expect(created.role).toBe('moderator');
    expect(created.badges.some((row) => row.kind === 'moderator')).toBe(true);
  });

  it('rejects role changes for non-admins · owner target · self demotion', async () => {
    members.rows.set(
      'member-2',
      makeCommunityMember({
        id: 'member-2',
        communityId: 'community-1',
        userId: 'user-2',
        role: 'moderator',
      }),
    );
    await expect(
      service.updateMemberRole('community-1', 'user-2', 'user-1', { role: 'member' }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    members.rows.set(
      'member-admin',
      makeCommunityMember({
        id: 'member-admin',
        communityId: 'community-1',
        userId: 'user-2',
        role: 'admin',
      }),
    );
    await expect(
      service.updateMemberRole('community-1', 'user-2', 'user-1', { role: 'admin' }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    await expect(
      service.updateMemberRole('community-1', 'user-2', 'user-2', { role: 'member' }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    await expect(
      service.updateMemberRole('community-1', 'user-1', 'missing', { role: 'moderator' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('patches description · visibility and skips pin notify for non-post objects', async () => {
    const updated = await service.updateCommunity('community-1', 'user-1', {
      description: 'A room for culture',
      visibility: 'public',
    });
    expect(updated.description).toBe('A room for culture');

    members.rows.set(
      'member-mod',
      makeCommunityMember({
        id: 'member-mod',
        communityId: 'community-1',
        userId: 'user-2',
        role: 'moderator',
      }),
    );
    const pin = await service.createPin('community-1', 'user-2', {
      objectType: 'review',
      objectId: 'review-1',
    });
    expect(pin.objectType).toBe('review');
  });
});

describe('CommunitiesService.listFeed', () => {
  it('returns an empty paginated feed for readable communities', async () => {
    const page = await service.listFeed('community-1', player);
    expect(page.items).toEqual([]);
    expect(page.hasMore).toBe(false);
    expect(page.cursor.next).toBeNull();
  });

  it('filters feed by tab=reviews', async () => {
    communityActivities.rows.push(
      {
        communityId: 'community-1',
        row: {
          communityActivityId: 'ca-post',
          activityItem: makeActivityItem({
            id: 'activity-post',
            kind: 'post',
            objectType: 'post',
            objectId: 'post-1',
            occurredAt: new Date('2026-01-02T00:00:00.000Z'),
          }),
          actor: makeUser({ id: 'user-1' }),
        },
      },
      {
        communityId: 'community-1',
        row: {
          communityActivityId: 'ca-review',
          activityItem: makeActivityItem({
            id: 'activity-review',
            kind: 'review',
            objectType: 'review',
            objectId: 'review-1',
            occurredAt: new Date('2026-01-01T00:00:00.000Z'),
          }),
          actor: makeUser({ id: 'user-1' }),
        },
      },
    );
    const page = await service.listFeed('community-1', player, { tab: 'reviews' });
    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.id).toBe('ca-review');
  });

  it('returns empty feed for tab=pinned and filters other tabs', async () => {
    const pinned = await service.listFeed('community-1', player, { tab: 'pinned' });
    expect(pinned.items).toEqual([]);

    communityActivities.rows.push(
      {
        communityId: 'community-1',
        row: {
          communityActivityId: 'ca-collection',
          activityItem: makeActivityItem({
            id: 'activity-collection',
            kind: 'collection',
            objectType: 'collection',
            objectId: 'collection-1',
            occurredAt: new Date('2026-01-03T00:00:00.000Z'),
          }),
          actor: makeUser({ id: 'user-1' }),
        },
      },
      {
        communityId: 'community-1',
        row: {
          communityActivityId: 'ca-event',
          activityItem: makeActivityItem({
            id: 'activity-event',
            kind: 'event',
            objectType: 'event',
            objectId: 'event-1',
            occurredAt: new Date('2026-01-02T00:00:00.000Z'),
          }),
          actor: makeUser({ id: 'user-1' }),
        },
      },
    );

    const collections = await service.listFeed('community-1', player, { tab: 'collections' });
    expect(collections.items.map((row) => row.id)).toEqual(['ca-collection']);
    const events = await service.listFeed('community-1', player, { tab: 'events' });
    expect(events.items.map((row) => row.id)).toEqual(['ca-event']);
  });

  it('returns 404 when the community is not readable', async () => {
    await expect(service.listFeed('community-private', guest)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('paginates community feed rows', async () => {
    communityActivities.rows.push(
      {
        communityId: 'community-1',
        row: {
          communityActivityId: 'ca-1',
          activityItem: makeActivityItem({
            id: 'activity-1',
            kind: 'post',
            objectType: 'post',
            objectId: 'post-1',
            occurredAt: new Date('2026-01-02T00:00:00.000Z'),
          }),
          actor: makeUser({ id: 'user-1', handle: 'gamer', displayName: 'Gamer' }),
        },
      },
      {
        communityId: 'community-1',
        row: {
          communityActivityId: 'ca-2',
          activityItem: makeActivityItem({
            id: 'activity-2',
            kind: 'post',
            objectType: 'post',
            objectId: 'post-2',
            occurredAt: new Date('2026-01-01T00:00:00.000Z'),
          }),
          actor: makeUser({ id: 'user-1', handle: 'gamer', displayName: 'Gamer' }),
        },
      },
    );

    const page1 = await service.listFeed('community-1', player, { limit: 1 });
    expect(page1.items[0]?.id).toBe('ca-1');
    expect(page1.hasMore).toBe(true);

    const page2 = await service.listFeed('community-1', player, {
      limit: 1,
      cursor: page1.cursor.next ?? undefined,
    });
    expect(page2.items[0]?.id).toBe('ca-2');
  });
});

describe('CommunitiesService.listActivity', () => {
  it('returns an empty paginated activity list for readable communities', async () => {
    const page = await service.listActivity('community-1', player);
    expect(page.items).toEqual([]);
    expect(page.hasMore).toBe(false);
    expect(page.cursor.next).toBeNull();
  });

  it('paginates community activity and rejects invalid cursors', async () => {
    communityActivities.rows.push(
      {
        communityId: 'community-1',
        row: {
          communityActivityId: 'ca-1',
          activityItem: makeActivityItem({
            id: 'activity-1',
            kind: 'post',
            objectType: 'post',
            objectId: 'post-1',
            occurredAt: new Date('2026-01-02T00:00:00.000Z'),
          }),
          actor: makeUser({ id: 'user-1', handle: 'gamer', displayName: 'Gamer' }),
        },
      },
      {
        communityId: 'community-1',
        row: {
          communityActivityId: 'ca-2',
          activityItem: makeActivityItem({
            id: 'activity-2',
            kind: 'post',
            objectType: 'post',
            objectId: 'post-2',
            occurredAt: new Date('2026-01-01T00:00:00.000Z'),
          }),
          actor: makeUser({ id: 'user-1', handle: 'gamer', displayName: 'Gamer' }),
        },
      },
    );

    const page1 = await service.listActivity('community-1', player, { limit: 1 });
    expect(page1.items[0]?.id).toBe('activity-1');
    expect(page1.hasMore).toBe(true);
    expect(page1.cursor.next).toEqual(expect.any(String));

    const page2 = await service.listActivity('community-1', player, {
      limit: 1,
      cursor: page1.cursor.next!,
    });
    expect(page2.items[0]?.id).toBe('activity-2');
    expect(page2.hasMore).toBe(false);

    await expect(
      service.listActivity('community-1', player, { cursor: 'bad' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('CommunitiesService.listEvents (3b.2a)', () => {
  it('returns an empty paginated list for a community with no events', async () => {
    const page = await service.listEvents('community-1', guest);
    expect(page.items).toEqual([]);
    expect(page.hasMore).toBe(false);
    expect(page.cursor.next).toBeNull();
  });

  it('paginates a community-scoped, soonest-first list and rejects invalid cursors', async () => {
    events = createFakeCommunityEventRepository([
      {
        id: 'event-soon',
        communityId: 'community-1',
        title: 'Culture Cup',
        startsAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      {
        id: 'event-later',
        communityId: 'community-1',
        title: 'Culture Cup 2',
        startsAt: new Date('2026-02-01T00:00:00.000Z'),
      },
      {
        id: 'event-other-community',
        communityId: 'community-private',
        title: 'Not this circle',
        startsAt: new Date('2026-01-15T00:00:00.000Z'),
      },
    ]);
    service = buildService();

    const page1 = await service.listEvents('community-1', guest, { limit: 1 });
    expect(page1.items[0]?.id).toBe('event-soon');
    expect(page1.hasMore).toBe(true);
    expect(page1.cursor.next).toEqual(expect.any(String));

    const page2 = await service.listEvents('community-1', guest, {
      limit: 1,
      cursor: page1.cursor.next!,
    });
    expect(page2.items[0]?.id).toBe('event-later');
    expect(page2.hasMore).toBe(false);

    await expect(
      service.listEvents('community-1', guest, { cursor: 'bad' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns 404 when the community is not readable', async () => {
    await expect(service.listEvents('community-private', guest)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('CommunitiesService.listEvents communityName / attendeeCount (9.4)', () => {
  beforeEach(() => {
    events = createFakeCommunityEventRepository([
      { id: 'event-empty', communityId: 'community-1', title: 'Empty Lobby' },
      { id: 'event-full', communityId: 'community-1', title: 'Packed House' },
    ]);
    eventParticipations = createFakeCommunityEventParticipationRepository([
      { eventId: 'event-full', userId: 'user-1', state: 'going' },
      { eventId: 'event-full', userId: 'user-2', state: 'hosting' },
      // Not commitments to attend — must not inflate the count.
      { eventId: 'event-full', userId: 'user-3', state: 'interested' },
      { eventId: 'event-full', userId: 'user-4', state: 'not_going' },
      { eventId: 'event-full', userId: 'user-5', state: 'looking_for_team' },
      { eventId: 'event-full', userId: 'user-6', state: 'need_players' },
    ]);
    service = buildService();
  });

  it('denormalizes the community name onto every row', async () => {
    const page = await service.listEvents('community-1', guest);
    expect(page.items.every((event) => event.communityName === 'Culture Room')).toBe(true);
  });

  it('reports 0 for an event with no attendees', async () => {
    const page = await service.listEvents('community-1', guest);
    expect(page.items.find((event) => event.id === 'event-empty')?.attendeeCount).toBe(0);
  });

  it('counts only going/hosting, not interested, not_going or the LFG states', async () => {
    const page = await service.listEvents('community-1', guest);
    expect(page.items.find((event) => event.id === 'event-full')?.attendeeCount).toBe(2);
  });

  it('batches communityName and attendeeCount in one query each, not per row', async () => {
    const findManyByIds = vi.spyOn(communities, 'findManyByIds');
    const countAttendeesByEvents = vi.spyOn(eventParticipations, 'countAttendeesByEvents');

    await service.listEvents('community-1', guest);

    expect(findManyByIds).toHaveBeenCalledTimes(1);
    expect(countAttendeesByEvents).toHaveBeenCalledTimes(1);
  });
});

describe('CommunitiesService followers visibility', () => {
  it('allows followers-only communities when viewer follows the owner', async () => {
    communities.rows.set(
      'community-followers',
      makeCommunity({
        id: 'community-followers',
        name: 'Followers Room',
        slug: 'followers-room',
        visibility: 'followers',
      }),
    );
    members.rows.set(
      'member-followers-owner',
      makeCommunityMember({
        id: 'member-followers-owner',
        communityId: 'community-followers',
        userId: 'user-2',
        role: 'owner',
      }),
    );
    follows.rows.set('follow-1', {
      id: 'follow-1',
      followerId: 'user-1',
      followeeId: 'user-2',
      createdAt: new Date(),
    } as never);

    const detail = await service.getCommunity('community-followers', player);
    expect(detail.id).toBe('community-followers');
  });
});
