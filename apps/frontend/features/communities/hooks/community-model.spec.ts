import type { CommunityMemberResponse, CommunityResponse } from '@gmrlog/types';
import { communityCreateSchema, communityPatchSchema } from '@gmrlog/validators';
import { describe, expect, it } from 'vitest';

import {
  formatJoinedDate,
  isCommunityMember,
  isCommunityOwner,
  isDirtyValues,
  isModeratorRole,
  optimisticJoin,
  optimisticLeave,
  resolveListView,
  roleLabel,
  toCommunityPatchPayload,
  visibilityLabel,
} from './community-model';

function community(partial: Partial<CommunityResponse> = {}): CommunityResponse {
  return {
    id: 'c1',
    name: 'Culture Room',
    description: 'Shared taste',
    avatarUrl: null,
    bannerUrl: null,
    viewerMembership: null,
    counts: { members: 2 },
    ...partial,
  };
}

describe('community model', () => {
  it('resolves list loading empty ready error', () => {
    expect(
      resolveListView({
        isPending: true,
        isError: false,
        error: null,
        items: [],
        isRefreshing: false,
      }).status,
    ).toBe('loading');
    expect(
      resolveListView({
        isPending: false,
        isError: true,
        error: new Error('x'),
        items: [],
        isRefreshing: false,
      }).status,
    ).toBe('error');
    expect(
      resolveListView({
        isPending: false,
        isError: false,
        error: null,
        items: [],
        isRefreshing: false,
      }).status,
    ).toBe('empty');
    expect(
      resolveListView({
        isPending: false,
        isError: false,
        error: null,
        items: [community()],
        isRefreshing: true,
      }).status,
    ).toBe('ready');
  });

  it('detects owner and member from viewerMembership', () => {
    expect(isCommunityMember(community())).toBe(false);
    expect(isCommunityOwner(community())).toBe(false);
    expect(
      isCommunityMember(
        community({
          viewerMembership: { role: 'member', joinedAt: '2026-01-01T00:00:00.000Z' },
        }),
      ),
    ).toBe(true);
    expect(
      isCommunityOwner(
        community({
          viewerMembership: { role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },
        }),
      ),
    ).toBe(true);
  });

  it('optimistically joins and leaves with rollback-ready snapshots', () => {
    const base = community({ counts: { members: 3 } });
    const joined = optimisticJoin(base);
    expect(joined.viewerMembership?.role).toBe('member');
    expect(joined.counts.members).toBe(4);
    const left = optimisticLeave(joined);
    expect(left.viewerMembership).toBeNull();
    expect(left.counts.members).toBe(3);
  });

  it('formats labels and joined dates', () => {
    expect(visibilityLabel('public')).toBe('Public');
    expect(roleLabel('moderator')).toBe('Moderator');
    expect(roleLabel('admin')).toBe('Admin');
    expect(formatJoinedDate('2026-01-15T12:00:00.000Z')).toContain('2026');
  });

  it('ranks moderator and above at or above the moderator rail threshold', () => {
    expect(isModeratorRole('member')).toBe(false);
    expect(isModeratorRole('moderator')).toBe(true);
    expect(isModeratorRole('admin')).toBe(true);
    expect(isModeratorRole('owner')).toBe(true);
  });

  it('detects dirty edit values', () => {
    expect(isDirtyValues({ name: 'A' }, { name: 'A' })).toBe(false);
    expect(isDirtyValues({ name: 'B' }, { name: 'A' })).toBe(true);
  });

  it('validates create and patch with shared schemas', () => {
    expect(
      communityCreateSchema.parse({
        name: 'Room',
        slug: 'room',
        description: null,
        visibility: 'public',
      }).slug,
    ).toBe('room');
    expect(() =>
      communityCreateSchema.parse({ name: 'x', slug: 'Bad', visibility: 'public' }),
    ).toThrow();
    expect(
      toCommunityPatchPayload({
        name: 'Room',
        description: '  ',
        visibility: 'private',
      }),
    ).toEqual({ name: 'Room', description: null, visibility: 'private' });
    expect(communityPatchSchema.parse({ name: 'Updated' }).name).toBe('Updated');
  });

  it('preserves backend members order (no alphabetical rewrite)', () => {
    const members: CommunityMemberResponse[] = [
      {
        user: {
          id: 'u2',
          handle: 'zeta',
          displayName: 'Zeta',
          avatarUrl: null,
        },
        role: 'member',
        joinedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        user: {
          id: 'u1',
          handle: 'alpha',
          displayName: 'Alpha',
          avatarUrl: null,
        },
        role: 'owner',
        joinedAt: '2026-01-02T00:00:00.000Z',
      },
    ];
    expect(members.map((m) => m.user.handle)).toEqual(['zeta', 'alpha']);
  });
});
