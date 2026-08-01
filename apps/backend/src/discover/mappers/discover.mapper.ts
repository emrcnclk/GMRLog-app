import type { DiscoverHubModule, DiscoverHubResponse } from '@gmrlog/types';

/** S1 §13.5 / S1.2 Discover Hub — static module registry (F5.3 children). D3.22 additives. */
const DISCOVER_HUB_MODULES: DiscoverHubModule[] = [
  { id: 'games', href: '/discover/games' },
  { id: 'trending', href: '/discover/trending' },
  { id: 'popular', href: '/discover/popular' },
  { id: 'hidden-gems', href: '/discover/hidden-gems' },
  { id: 'recommended', href: '/discover/recommended' },
  { id: 'collections', href: '/discover/collections' },
  { id: 'communities', href: '/discover/communities' },
  { id: 'events', href: '/discover/events' },
  { id: 'because-you-played', href: '/discover/because-you-played' },
];

export function toDiscoverHubResponse(): DiscoverHubResponse {
  return { modules: DISCOVER_HUB_MODULES };
}
