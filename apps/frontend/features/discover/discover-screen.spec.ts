import { describe, expect, it } from 'vitest';

import {
  discoverModuleDescription,
  discoverModuleTitle,
  formatEventStartsAt,
  hubHrefToRoute,
  resolveDiscoverHubView,
  resolveDiscoverListView,
} from './hooks/discover-model';

describe('Discover loading / empty / error states', () => {
  it('hub prefers loading then empty', () => {
    expect(
      resolveDiscoverHubView({
        isPending: true,
        isError: false,
        error: null,
        modules: [],
        isRefreshing: false,
      }).status,
    ).toBe('loading');
    expect(
      resolveDiscoverHubView({
        isPending: false,
        isError: false,
        error: null,
        modules: [],
        isRefreshing: false,
      }).status,
    ).toBe('empty');
  });

  it('list prefers error over empty on first failure', () => {
    expect(
      resolveDiscoverListView({
        isPending: false,
        isError: true,
        error: new Error('offline'),
        items: [],
        isRefreshing: false,
        isFetchingNextPage: false,
        hasNextPage: false,
      }).status,
    ).toBe('error');
  });

  it('hub ready when modules include D3.22 ids', () => {
    const view = resolveDiscoverHubView({
      isPending: false,
      isError: false,
      error: null,
      modules: [
        { id: 'trending', href: '/discover/trending' },
        { id: 'popular', href: '/discover/popular' },
        { id: 'hidden-gems', href: '/discover/hidden-gems' },
        { id: 'recommended', href: '/discover/recommended' },
        { id: 'collections', href: '/discover/collections' },
      ],
      isRefreshing: false,
    });
    expect(view.status).toBe('ready');
    expect(view.modules).toHaveLength(5);
  });

  it('list ready preserves fetch-next flags for new surfaces', () => {
    const view = resolveDiscoverListView({
      isPending: false,
      isError: false,
      error: null,
      items: [{ id: 'g1' }],
      isRefreshing: true,
      isFetchingNextPage: true,
      hasNextPage: true,
    });
    expect(view.status).toBe('ready');
    expect(view.isRefreshing).toBe(true);
    expect(view.isFetchingNextPage).toBe(true);
    expect(view.hasNextPage).toBe(true);
  });
});

describe('Discover D3.22 route + copy helpers', () => {
  it('maps additive hub hrefs to Expo child routes', () => {
    expect(hubHrefToRoute('/discover/trending')).toBe('/trending');
    expect(hubHrefToRoute('/discover/popular')).toBe('/popular');
    expect(hubHrefToRoute('/discover/hidden-gems')).toBe('/hidden-gems');
    expect(hubHrefToRoute('/discover/recommended')).toBe('/recommended');
    expect(hubHrefToRoute('/discover/collections')).toBe('/collections');
  });

  it('titles and describes new discover modules', () => {
    expect(discoverModuleTitle('trending')).toBe('Trending');
    expect(discoverModuleTitle('popular')).toBe('Popular');
    expect(discoverModuleTitle('hidden-gems')).toBe('Hidden Gems');
    expect(discoverModuleTitle('recommended')).toBe('Recommended');
    expect(discoverModuleTitle('collections')).toBe('Collections');
    expect(discoverModuleDescription('trending')).toContain('culture');
    expect(discoverModuleDescription('hidden-gems')).toContain('quieter');
  });

  it('title-cases unknown module ids gracefully', () => {
    expect(discoverModuleTitle('friends-playing')).toBe('Friends Playing');
    expect(discoverModuleDescription('friends-playing')).toBe('Explore this discover module');
  });

  it('keeps legacy href mapping', () => {
    expect(hubHrefToRoute('/discover/games')).toBe('/games');
    expect(hubHrefToRoute('/discover/communities')).toBe('/communities');
    expect(hubHrefToRoute('/discover/events')).toBe('/events');
    expect(hubHrefToRoute('/discover/unknown')).toBeNull();
  });

  it('formats event starts for discover cards', () => {
    const now = Date.parse('2026-07-29T12:00:00.000Z');
    expect(formatEventStartsAt('2026-07-29T18:00:00.000Z', now)).toBe('Starts today');
    expect(formatEventStartsAt('2026-07-29T06:00:00.000Z', now)).toBe('Started today');
    expect(formatEventStartsAt('not-a-date', now)).toBe('');
  });
});
