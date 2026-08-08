import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';

import type { PostRepository } from '@gmrlog/database';

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
let notifications!: { create: (data: unknown) => Promise<{ id: string }> };
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
  );
}

beforeEach(() => {
  follows = createFakeFollowRepository();
  notifications = { create: async () => ({ id: 'n1' }) as never };
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

  it('rejects a malformed cursor rather than returning page one', async () => {
    await expect(service.listCommunities(guest, { cursor: 'not-a-cursor' })).rejects.toThrow();
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
