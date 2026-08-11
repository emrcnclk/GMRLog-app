import type { CommunityResponse } from '@gmrlog/types';
import { describe, expect, it } from 'vitest';

import {
  CIRCLE_KIND_FILTERS,
  COMMUNITY_DETAIL_TABS,
  activeNowCommunities,
  communityDetailMeta,
  communityDirectoryMeta,
  communityFooterLine,
  communityFriendReason,
  splitCommunityDirectory,
} from './community-directory-model';

function community(
  id: string,
  members: number,
  joined: boolean,
  viewerFriendCount?: number,
  activity?: { postsToday: number; activeNow: boolean },
): CommunityResponse {
  return {
    id,
    name: `Circle ${id}`,
    description: null,
    avatarUrl: null,
    bannerUrl: null,
    viewerMembership: joined ? { role: 'member', joinedAt: '2026-01-01T00:00:00.000Z' } : null,
    counts: { members },
    ...(viewerFriendCount === undefined ? {} : { viewerFriendCount }),
    ...(activity ?? {}),
  };
}

describe('community directory model', () => {
  it('splits §13’s two sections on membership, keeping backend order', () => {
    const items = [
      community('a', 10, false),
      community('b', 20, true),
      community('c', 30, false),
      community('d', 40, true),
    ];
    const sections = splitCommunityDirectory(items);
    // Order inside each section is the order the API gave — the client ranks
    // nothing.
    expect(sections.joined.map((c) => c.id)).toEqual(['b', 'd']);
    expect(sections.suggested.map((c) => c.id)).toEqual(['a', 'c']);
  });

  it('leaves both sections empty for an empty list', () => {
    const sections = splitCommunityDirectory([]);
    expect(sections.joined).toEqual([]);
    expect(sections.suggested).toEqual([]);
  });

  it('counts the directory and the joined subset', () => {
    const items = [community('a', 1, false), community('b', 2, true), community('c', 3, true)];
    expect(communityDirectoryMeta(items)).toBe('3 circles · 2 joined');
  });

  it('says circle in the singular', () => {
    expect(communityDirectoryMeta([community('a', 1, true)])).toBe('1 circle · 1 joined');
    expect(communityDirectoryMeta([])).toBe('0 circles · 0 joined');
  });

  it('carries only the member count when the caller has not computed activity', () => {
    // A response that predates 3b.1e (the optional-DTO case) must not imply a
    // count it never sent.
    expect(communityFooterLine(community('a', 1204, false))).toBe('1204 members');
    expect(communityFooterLine(community('b', 1, false))).toBe('1 member');
    expect(communityFooterLine(community('c', 0, false))).toBe('0 members');
  });

  it('appends posts today once the activity signal is present (3b.1e)', () => {
    expect(
      communityFooterLine(
        community('a', 1204, false, undefined, { postsToday: 3, activeNow: true }),
      ),
    ).toBe('1204 members · 3 posts today');
    expect(
      communityFooterLine(community('b', 1, false, undefined, { postsToday: 1, activeNow: false })),
    ).toBe('1 member · 1 post today');
    expect(
      communityFooterLine(community('c', 0, false, undefined, { postsToday: 0, activeNow: false })),
    ).toBe('0 members · 0 posts today');
  });

  it('offers the prototype’s own five filter pills, "All" first', () => {
    expect(CIRCLE_KIND_FILTERS.map((f) => f.value)).toEqual([
      'all',
      'games',
      'board_games',
      'cosplay',
      'live_events',
    ]);
  });

  describe('active now rail (3b.1e)', () => {
    it('keeps only circles the server flagged active, in the same order', () => {
      const items = [
        community('a', 1, false, undefined, { postsToday: 4, activeNow: true }),
        community('b', 2, false, undefined, { postsToday: 0, activeNow: false }),
        community('c', 3, false, undefined, { postsToday: 1, activeNow: true }),
      ];
      expect(activeNowCommunities(items).map((c) => c.id)).toEqual(['a', 'c']);
    });

    it('is empty when nothing is active, not when nothing has been computed', () => {
      expect(activeNowCommunities([community('a', 1, false)])).toEqual([]);
      expect(
        activeNowCommunities([
          community('a', 1, false, undefined, { postsToday: 0, activeNow: false }),
        ]),
      ).toEqual([]);
    });
  });

  describe('detail shell (§14)', () => {
    it('carries only the meta term the DTO can answer', () => {
      // §14 asks for "members · created · privacy". `CommunityResponse` has no
      // createdAt and deliberately does not project visibility, so the line is
      // the member count alone — never a placeholder for the other two.
      expect(communityDetailMeta(community('a', 42, false))).toBe('42 members');
      expect(communityDetailMeta(community('b', 1, false))).toBe('1 member');
      expect(communityDetailMeta(community('c', 0, false))).not.toContain('·');
    });

    it('offers all four §14 tabs, in §14’s order', () => {
      // 3b.2a built the missing `GET /communities/{id}/events` route, so
      // Events now has a source the same as the other three.
      expect(COMMUNITY_DETAIL_TABS.map((t) => t.id)).toEqual([
        'feed',
        'members',
        'events',
        'about',
      ]);
      expect(COMMUNITY_DETAIL_TABS.map((t) => t.label)).toEqual([
        'Feed',
        'Members',
        'Events',
        'About',
      ]);
    });
  });

  describe('friend reason (3b.1b)', () => {
    it('gives §13’s line when friends are already there', () => {
      expect(communityFriendReason(community('a', 10, false, 3))).toBe('3 friends here');
      expect(communityFriendReason(community('b', 10, false, 1))).toBe('1 friend here');
    });

    it('says nothing when there is nothing to say', () => {
      // No friends there, a guest (field absent), and a circle already joined —
      // "friends here" is an argument for joining, not a fact about a member.
      expect(communityFriendReason(community('c', 10, false, 0))).toBeNull();
      expect(communityFriendReason(community('d', 10, false))).toBeNull();
      expect(communityFriendReason(community('e', 10, true, 4))).toBeNull();
    });
  });
});
