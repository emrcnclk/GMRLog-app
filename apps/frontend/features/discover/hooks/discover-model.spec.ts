import { describe, expect, it } from 'vitest';

import {
  discoverModuleDescription,
  discoverModuleTitle,
  formatEventStartsAt,
  hubHrefToRoute,
  resolveDiscoverHubView,
  resolveDiscoverListView,
} from './discover-model';

describe('resolveDiscoverListView', () => {
  it('follows Loading → Empty → Ready order', () => {
    expect(
      resolveDiscoverListView({
        isPending: true,
        isError: false,
        error: null,
        items: [],
        isRefreshing: false,
        isFetchingNextPage: false,
        hasNextPage: false,
      }).status,
    ).toBe('loading');

    expect(
      resolveDiscoverListView({
        isPending: false,
        isError: true,
        error: new Error('x'),
        items: [],
        isRefreshing: false,
        isFetchingNextPage: false,
        hasNextPage: false,
      }).status,
    ).toBe('error');

    expect(
      resolveDiscoverListView({
        isPending: false,
        isError: false,
        error: null,
        items: [],
        isRefreshing: false,
        isFetchingNextPage: false,
        hasNextPage: false,
      }).status,
    ).toBe('empty');

    expect(
      resolveDiscoverListView({
        isPending: false,
        isError: false,
        error: null,
        items: [{ id: '1' }],
        isRefreshing: false,
        isFetchingNextPage: true,
        hasNextPage: true,
      }).status,
    ).toBe('ready');
  });

  it('keeps cached items when a later page errors', () => {
    const view = resolveDiscoverListView({
      isPending: false,
      isError: true,
      error: new Error('page-2'),
      items: [{ id: 'cached' }],
      isRefreshing: false,
      isFetchingNextPage: false,
      hasNextPage: true,
    });
    expect(view.status).toBe('ready');
    expect(view.items).toEqual([{ id: 'cached' }]);
  });
});

describe('resolveDiscoverHubView', () => {
  it('loads then renders modules', () => {
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
        modules: [{ id: 'games' }],
        isRefreshing: false,
      }).status,
    ).toBe('ready');
  });

  it('surfaces hub refresh while ready', () => {
    const view = resolveDiscoverHubView({
      isPending: false,
      isError: false,
      error: null,
      modules: [{ id: 'trending' }],
      isRefreshing: true,
    });
    expect(view.status).toBe('ready');
    expect(view.isRefreshing).toBe(true);
  });
});

describe('hubHrefToRoute', () => {
  it('maps S1 hrefs to Expo child routes', () => {
    expect(hubHrefToRoute('/discover/games')).toBe('/games');
    expect(hubHrefToRoute('/discover/communities')).toBe('/communities');
    expect(hubHrefToRoute('/discover/events')).toBe('/events');
    expect(hubHrefToRoute('/unknown')).toBeNull();
  });

  it('maps D3.22 discover module hrefs', () => {
    expect(hubHrefToRoute('/discover/trending')).toBe('/trending');
    expect(hubHrefToRoute('/discover/popular')).toBe('/popular');
    expect(hubHrefToRoute('/discover/hidden-gems')).toBe('/hidden-gems');
    expect(hubHrefToRoute('/discover/recommended')).toBe('/recommended');
    expect(hubHrefToRoute('/discover/collections')).toBe('/collections');
  });
});

describe('discover copy helpers', () => {
  it('titles modules', () => {
    expect(discoverModuleTitle('games')).toBe('Games');
    expect(discoverModuleTitle('communities')).toBe('Communities');
    expect(discoverModuleTitle('events')).toBe('Events');
    expect(discoverModuleTitle('trending')).toBe('Trending');
    expect(discoverModuleTitle('popular')).toBe('Popular');
    expect(discoverModuleTitle('hidden-gems')).toBe('Hidden Gems');
    expect(discoverModuleTitle('recommended')).toBe('Recommended');
    expect(discoverModuleTitle('collections')).toBe('Collections');
  });

  it('describes modules including graceful unknown fallback', () => {
    expect(discoverModuleDescription('games')).toBe('Browse the games catalog');
    expect(discoverModuleDescription('collections')).toContain('shelves');
    expect(discoverModuleDescription('because-you-played')).toBe('Explore this discover module');
    expect(discoverModuleTitle('because-you-played')).toBe('Because You Played');
  });

  it('formats event starts', () => {
    const now = Date.parse('2026-07-27T12:00:00.000Z');
    expect(formatEventStartsAt('2026-07-27T18:00:00.000Z', now)).toBe('Starts today');
    expect(formatEventStartsAt('2026-07-28T18:00:00.000Z', now)).not.toBe('Starts today');
  });
});
