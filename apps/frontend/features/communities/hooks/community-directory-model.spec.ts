import type { CommunityResponse } from '@gmrlog/types';
import { describe, expect, it } from 'vitest';

import {
  communityDirectoryMeta,
  communityFooterLine,
  splitCommunityDirectory,
} from './community-directory-model';

function community(id: string, members: number, joined: boolean): CommunityResponse {
  return {
    id,
    name: `Circle ${id}`,
    description: null,
    avatarUrl: null,
    bannerUrl: null,
    viewerMembership: joined ? { role: 'member', joinedAt: '2026-01-01T00:00:00.000Z' } : null,
    counts: { members },
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
});
