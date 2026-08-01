import type {
  CollectionResponse,
  LibraryEntryResponse,
  PlayerArchetypeKey,
  ProfileHeroResponse,
  ReputationBadgeValue,
} from '@gmrlog/types';

import { ARCHETYPE_LABELS, archetypeLabel } from './profile-model';

export const REPUTATION_BADGE_LABELS: Record<ReputationBadgeValue, string> = {
  helpful_reviewer: 'Helpful Reviewer',
  strategy_expert: 'Strategy Expert',
  lore_master: 'Lore Master',
  achievement_hunter: 'Achievement Hunter',
  community_leader: 'Community Leader',
};

export const RSVP_LFG_STATES = [
  'looking_for_team',
  'need_players',
  'hosting',
  'going',
  'interested',
] as const;

export function reputationBadgeLabel(badge: ReputationBadgeValue): string {
  return REPUTATION_BADGE_LABELS[badge];
}

export function formatMemberSince(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
  });
}

export function resolveGameTitle(
  gameId: string | null,
  entries: readonly LibraryEntryResponse[],
): string | null {
  if (!gameId) {
    return null;
  }
  const entry = entries.find((item) => item.gameId === gameId);
  return entry?.game.title ?? gameId;
}

export function resolveFavoriteTitles(
  gameIds: readonly string[],
  entries: readonly LibraryEntryResponse[],
): string[] {
  return gameIds.map((gameId) => resolveGameTitle(gameId, entries) ?? gameId);
}

export function resolvePinnedCollectionTitle(
  collectionId: string | null,
  collections: readonly CollectionResponse[],
): string | null {
  if (!collectionId) {
    return null;
  }
  const collection = collections.find((item) => item.id === collectionId);
  return collection?.title ?? collectionId;
}

export function formatHeroArchetypes(keys: readonly string[]): string[] {
  return keys.map((key) => {
    if (key in ARCHETYPE_LABELS) {
      return archetypeLabel(key as PlayerArchetypeKey);
    }
    return key.replace(/_/g, ' ');
  });
}

export function formatCompletionPercent(value: number | null): string {
  if (value === null) {
    return '—';
  }
  return `${String(Math.round(value))}%`;
}

export function formatSteamLevel(value: number | null): string {
  if (value === null) {
    return '—';
  }
  return String(value);
}

export function formatTotalHours(value: number | null): string {
  if (value === null) {
    return '—';
  }
  return `${String(Math.round(value))}h`;
}

export function hasHeroContent(hero: ProfileHeroResponse | null | undefined): boolean {
  if (!hero) {
    return false;
  }
  return (
    hero.currentlyPlayingGameId !== null ||
    hero.favoriteGameIds.length > 0 ||
    hero.steamLevel !== null ||
    hero.completionPercent !== null ||
    hero.archetypeKeys.length > 0 ||
    hero.pinnedCollectionId !== null ||
    hero.topGenre !== null ||
    hero.reputationBadges.length > 0 ||
    hero.creatorBadge
  );
}
