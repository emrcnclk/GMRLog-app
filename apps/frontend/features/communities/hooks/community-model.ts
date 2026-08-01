import type { CommunityResponse, ContentVisibilityValue } from '@gmrlog/types';
import {
  communityCreateSchema,
  communityPatchSchema,
  contentVisibilitySchema,
} from '@gmrlog/validators';
import { z } from 'zod';

export type ListViewStatus = 'loading' | 'error' | 'empty' | 'ready';

export interface ListViewModel<T> {
  status: ListViewStatus;
  items: T[];
  error: unknown;
  isRefreshing: boolean;
}

export function resolveListView<T>(input: {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  items: T[];
  isRefreshing: boolean;
}): ListViewModel<T> {
  if (input.isPending && input.items.length === 0) {
    return { status: 'loading', items: [], error: null, isRefreshing: false };
  }
  if (input.isError && input.items.length === 0) {
    return {
      status: 'error',
      items: [],
      error: input.error,
      isRefreshing: input.isRefreshing,
    };
  }
  if (input.items.length === 0) {
    return {
      status: 'empty',
      items: [],
      error: null,
      isRefreshing: input.isRefreshing,
    };
  }
  return {
    status: 'ready',
    items: input.items,
    error: input.error,
    isRefreshing: input.isRefreshing,
  };
}

export function isCommunityOwner(community: CommunityResponse): boolean {
  return community.viewerMembership?.role === 'owner';
}

export function isCommunityMember(community: CommunityResponse): boolean {
  return community.viewerMembership !== null;
}

export function visibilityLabel(visibility: ContentVisibilityValue): string {
  switch (visibility) {
    case 'public':
      return 'Public';
    case 'followers':
      return 'Followers';
    case 'private':
      return 'Private';
    case 'community':
      return 'Community';
    default: {
      const _exhaustive: never = visibility;
      return _exhaustive;
    }
  }
}

export function roleLabel(role: string): string {
  switch (role) {
    case 'owner':
      return 'Owner';
    case 'moderator':
      return 'Moderator';
    case 'member':
      return 'Member';
    default:
      return role;
  }
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return (parts[0] ?? '?').slice(0, 2).toUpperCase();
  }
  return `${(parts[0] ?? '').slice(0, 1)}${(parts[1] ?? '').slice(0, 1)}`.toUpperCase();
}

export function formatJoinedDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Create form mirrors communityCreateSchema. */
export const communityComposerCreateSchema = communityCreateSchema;

export type CommunityComposerCreateValues = z.infer<typeof communityComposerCreateSchema>;

/**
 * Edit form — name/description from response; visibility optional patch
 * (CommunityResponse does not project visibility — user sets when changing).
 */
export const communityComposerEditSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    description: z.string().max(10_000),
    visibility: contentVisibilitySchema,
  })
  .strict();

export type CommunityComposerEditValues = z.infer<typeof communityComposerEditSchema>;

export function toCommunityPatchPayload(values: CommunityComposerEditValues) {
  return communityPatchSchema.parse({
    name: values.name,
    description: values.description.trim().length === 0 ? null : values.description,
    visibility: values.visibility,
  });
}

export function isDirtyValues<T extends Record<string, unknown>>(current: T, baseline: T): boolean {
  return JSON.stringify(current) !== JSON.stringify(baseline);
}

export function optimisticJoin(community: CommunityResponse): CommunityResponse {
  return {
    ...community,
    viewerMembership: {
      role: 'member',
      joinedAt: new Date().toISOString(),
    },
    counts: { members: community.counts.members + 1 },
  };
}

export function optimisticLeave(community: CommunityResponse): CommunityResponse {
  return {
    ...community,
    viewerMembership: null,
    counts: { members: Math.max(0, community.counts.members - 1) },
  };
}
