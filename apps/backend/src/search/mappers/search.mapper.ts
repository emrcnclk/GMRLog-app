import type { SearchHitRecord } from '@gmrlog/database';
import type { SearchHit } from '@gmrlog/types';

import { resolveMediaUrl } from '../../infrastructure/media/resolve-media-url';

export const SEARCH_EXCERPT_MAX = 120;

/** D3.22 Search++ — achievement / tag hit records (Prisma fallback; not Meili-indexed). */
export interface SearchAchievementHitRecord {
  type: 'achievement';
  id: string;
  orderedAt: Date;
  achievement: { id: string; title: string; category: string };
}

export interface SearchTagHitRecord {
  type: 'tag';
  id: string;
  orderedAt: Date;
  tag: { id: string; name: string; slug: string };
}

export type ExtendedSearchHitRecord =
  SearchHitRecord | SearchAchievementHitRecord | SearchTagHitRecord;

export function excerptText(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= SEARCH_EXCERPT_MAX) {
    return trimmed;
  }
  return trimmed.slice(0, SEARCH_EXCERPT_MAX);
}

export function toSearchHit(record: ExtendedSearchHitRecord): SearchHit {
  switch (record.type) {
    case 'game':
      return {
        type: 'game',
        id: record.id,
        summary: {
          title: record.game.title,
          slug: record.game.slug,
          // D3.25 — catalog enrichment surfaced in search results. `genres`
          // is undefined on the direct-Postgres fallback path (Meili down);
          // cover/summary still resolve there since they're real Game columns.
          coverImageUrl: resolveMediaUrl(record.game.coverKey),
          summary: record.game.summary,
          genres: record.genres ?? [],
        },
      };
    case 'user':
      return {
        type: 'user',
        id: record.id,
        summary: { handle: record.user.handle, displayName: record.user.displayName },
      };
    case 'review':
      return {
        type: 'review',
        id: record.id,
        summary: {
          excerpt: excerptText(record.review.body ?? ''),
          gameTitle: record.game.title,
        },
      };
    case 'post':
      return {
        type: 'post',
        id: record.id,
        summary: { excerpt: excerptText(record.post.body) },
      };
    case 'collection':
      return {
        type: 'collection',
        id: record.id,
        summary: { title: record.collection.title },
      };
    case 'tier-list':
      return {
        type: 'tier-list',
        id: record.id,
        summary: { title: record.tierList.title },
      };
    case 'community':
      return {
        type: 'community',
        id: record.id,
        summary: { name: record.community.name },
      };
    case 'event':
      return {
        type: 'event',
        id: record.id,
        summary: { title: record.event.title, kind: record.event.kind },
      };
    case 'achievement':
      return {
        type: 'achievement',
        id: record.id,
        summary: { name: record.achievement.title, category: record.achievement.category },
      };
    case 'tag':
      return {
        type: 'tag',
        id: record.id,
        summary: { name: record.tag.name, slug: record.tag.slug },
      };
  }
}
