import type { GameHubResponse } from '@gmrlog/types';

/** Game Hub presentation helpers (D3.24). */
export function formatHubTabLabel(label: string, count: number | undefined): string {
  if (count === undefined) {
    return label;
  }
  return `${label} (${String(count)})`;
}

export interface GameHubTabLink {
  key: string;
  label: string;
  routeSuffix: string;
  countKey?: keyof GameHubResponse['tabCounts'];
}

export const GAME_HUB_TABS: readonly GameHubTabLink[] = [
  { key: 'timeline', label: 'Timeline', routeSuffix: 'timeline' },
  { key: 'reviews', label: 'Reviews', routeSuffix: 'reviews', countKey: 'reviews' },
  { key: 'guides', label: 'Guides', routeSuffix: 'guides', countKey: 'guides' },
  { key: 'collections', label: 'Collections', routeSuffix: 'collections', countKey: 'collections' },
  { key: 'events', label: 'Events', routeSuffix: 'events', countKey: 'events' },
  { key: 'communities', label: 'Communities', routeSuffix: 'communities', countKey: 'communities' },
  { key: 'players', label: 'Players', routeSuffix: 'players', countKey: 'players' },
  { key: 'screenshots', label: 'Screenshots', routeSuffix: 'screenshots', countKey: 'screenshots' },
] as const;

export function gameHubTabPath(gameId: string, routeSuffix: string): string {
  return `/(app)/game/${gameId}/${routeSuffix}`;
}
