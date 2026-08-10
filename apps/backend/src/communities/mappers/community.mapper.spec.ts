import { describe, expect, it } from 'vitest';

import { makeActivityItem } from '../../activity/testing/fake-repositories';
import { makeCommunity, makeCommunityMember } from '../testing/fake-repositories';
import { makeUser } from '../../users/testing/fake-repositories';

import {
  canViewerReadCommunity,
  toCommunityFeedItemResponse,
  toCommunityLeaderboardEntry,
  toCommunityMemberResponse,
  toCommunityMembershipSummary,
  toCommunityResponse,
  toUserPublicResponse,
} from './community.mapper';

describe('community.mapper', () => {
  const user = makeUser({ id: 'user-1', handle: 'player', displayName: 'Player' });
  const community = makeCommunity({
    id: 'community-1',
    name: 'Culture Club',
    description: 'A place',
    visibility: 'followers',
  });
  const member = makeCommunityMember({
    communityId: 'community-1',
    userId: 'user-1',
    role: 'member',
    joinedAt: new Date('2026-01-01T00:00:00.000Z'),
  });

  it('projects community and member responses', () => {
    expect(toUserPublicResponse(user)).toMatchObject({
      id: 'user-1',
      handle: 'player',
      displayName: 'Player',
    });
    expect(toCommunityMembershipSummary(member)).toMatchObject({
      role: 'member',
      joinedAt: '2026-01-01T00:00:00.000Z',
    });
    expect(toCommunityResponse(community, 3, null)).toMatchObject({
      id: 'community-1',
      name: 'Culture Club',
      counts: { members: 3 },
      viewerMembership: null,
      kind: 'games',
    });
    expect(toCommunityResponse(community, 3, null)).not.toHaveProperty('postsToday');
    expect(toCommunityMemberResponse(member, user).user.handle).toBe('player');
    expect(toCommunityMemberResponse(member, user).badges).toEqual([]);
  });

  it('7.1 — isContributor is a real boolean when passed, absent when not', () => {
    expect(toCommunityMemberResponse(member, user)).not.toHaveProperty('isContributor');
    expect(toCommunityMemberResponse(member, user, [], true).isContributor).toBe(true);
    expect(toCommunityMemberResponse(member, user, [], false).isContributor).toBe(false);
  });

  it('7.1 — toCommunityLeaderboardEntry projects rank, user and points', () => {
    expect(toCommunityLeaderboardEntry(1, user, 42)).toEqual({
      rank: 1,
      user: toUserPublicResponse(user),
      points: 42,
    });
  });

  it('carries the activity signal only when the caller computed one (3b.1e)', () => {
    expect(
      toCommunityResponse(community, 3, null, undefined, { postsToday: 4, activeNow: true }),
    ).toMatchObject({ postsToday: 4, activeNow: true });
  });

  it('applies community visibility rules', () => {
    expect(canViewerReadCommunity('public', 'owner-1', null, false)).toBe(true);
    expect(canViewerReadCommunity('private', 'owner-1', null, false)).toBe(false);
    expect(canViewerReadCommunity('followers', 'owner-1', 'viewer-1', false, true)).toBe(true);
    expect(canViewerReadCommunity('followers', 'owner-1', 'viewer-1', false, false)).toBe(false);
    expect(canViewerReadCommunity('private', 'owner-1', 'owner-1', false)).toBe(true);
    expect(canViewerReadCommunity('private', 'owner-1', 'viewer-1', true)).toBe(true);
  });

  it('maps community feed rows', () => {
    const row = {
      communityActivityId: 'ca-1',
      activityItem: makeActivityItem({
        id: 'activity-1',
        kind: 'post',
        objectType: 'post',
        objectId: 'post-1',
        occurredAt: new Date('2026-01-02T00:00:00.000Z'),
      }),
      actor: user,
    };
    expect(toCommunityFeedItemResponse(row)).toMatchObject({
      id: 'ca-1',
      kind: 'post',
      object: { type: 'post', id: 'post-1' },
      projection: null,
    });
  });
});
