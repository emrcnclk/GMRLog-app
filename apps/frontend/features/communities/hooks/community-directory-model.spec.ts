import type { CommunityResponse } from '@gmrlog/types';
import { describe, expect, it } from 'vitest';

import {
  COMMUNITY_DETAIL_TABS,
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

  it('carries only the member count in the card footer', () => {
    // §13 also asks for "posts today" and a live dot; neither has a field, and
    // the line must not imply one. If a `postsToday` ever lands on the DTO this
    // is the single place that changes.
    expect(communityFooterLine(community('a', 1204, false))).toBe('1204 members');
    expect(communityFooterLine(community('b', 1, false))).toBe('1 member');
    expect(communityFooterLine(community('c', 0, false))).toBe('0 members');
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

    it('offers the three tabs that have an endpoint, in §14’s order', () => {
      // §14 lists Feed / Members / Events / About; nothing under
      // `/communities/{id}` returns events, so that tab is not offered.
      expect(COMMUNITY_DETAIL_TABS.map((t) => t.id)).toEqual(['feed', 'members', 'about']);
      expect(COMMUNITY_DETAIL_TABS.map((t) => t.label)).toEqual(['Feed', 'Members', 'About']);
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
