import type {
  CollectionResponse,
  CommunityResponse,
  EventResponse,
  GameCardResponse,
} from '@gmrlog/types';
import { EntityList, useTheme } from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { CollectionCard } from '../../collections/components/collection-card';
import { CommunityCard } from '../../communities/components/community-card';
import { EventCard } from '../../events/components/event-card';

import { DiscoverCardSkeleton, DiscoverGridSkeleton } from './discover-skeleton';
import { GamePosterCard, POSTER_WIDTH } from './game-poster-card';

interface DiscoverListChromeProps {
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
  onEndReached: () => void;
  isFetchingNextPage: boolean;
}

/**
 * Columns for the game grid.
 *
 * Two across a phone keeps the cover large enough to sell the game, which is
 * the whole point of Discover; three would return us to the thumbnail row this
 * sprint replaced.
 */
const GAME_GRID_COLUMNS = 2;

/**
 * Full-catalog game browse — a poster grid, not a list of rows.
 *
 * These four lists used to be near-identical `FlatList` wrappers differing only
 * in item type and card. They render through `EntityList` now, so scroll
 * physics, refresh tint, pagination threshold, footer treatment, and list
 * semantics are defined once in the design system.
 */
export function GameCardList({
  items,
  refreshing,
  onRefresh,
  onEndReached,
  isFetchingNextPage,
}: DiscoverListChromeProps & { items: GameCardResponse[] }) {
  const theme = useTheme();
  const router = useRouter();

  const openGame = useCallback(
    (gameId: string) => {
      router.push(`/(app)/game/${gameId}`);
    },
    [router],
  );

  return (
    <EntityList
      items={items}
      keyExtractor={(item) => item.id}
      renderItem={(item, index) => (
        <GamePosterCard
          game={item}
          onPress={openGame}
          width={POSTER_WIDTH}
          // Roughly the first three rows are on screen at mount.
          priority={index < GAME_GRID_COLUMNS * 3 ? 'normal' : 'low'}
        />
      )}
      numColumns={GAME_GRID_COLUMNS}
      refreshing={refreshing}
      onRefresh={() => {
        void onRefresh();
      }}
      onEndReached={onEndReached}
      isFetchingNextPage={isFetchingNextPage}
      footerSkeleton={<DiscoverGridSkeleton rows={1} />}
      contentContainerStyle={{
        paddingTop: theme.space('space.4'),
        gap: theme.space('space.5'),
        paddingBottom: theme.space('space.8'),
      }}
      accessibilityLabel="Games"
    />
  );
}

export function CommunityCardList({
  items,
  refreshing,
  onRefresh,
  onEndReached,
  isFetchingNextPage,
}: DiscoverListChromeProps & { items: CommunityResponse[] }) {
  const router = useRouter();

  const openCommunity = useCallback(
    (id: string) => {
      router.push(`/(app)/community/${id}`);
    },
    [router],
  );

  return (
    <EntityList
      items={items}
      keyExtractor={(item) => item.id}
      renderItem={(item) => <CommunityCard community={item} onPress={openCommunity} />}
      refreshing={refreshing}
      onRefresh={() => {
        void onRefresh();
      }}
      onEndReached={onEndReached}
      isFetchingNextPage={isFetchingNextPage}
      footerSkeleton={<DiscoverCardSkeleton />}
      accessibilityLabel="Communities"
    />
  );
}

export function EventCardList({
  items,
  refreshing,
  onRefresh,
  onEndReached,
  isFetchingNextPage,
}: DiscoverListChromeProps & { items: EventResponse[] }) {
  const router = useRouter();

  const openEvent = useCallback(
    (id: string) => {
      router.push(`/(app)/event/${id}`);
    },
    [router],
  );

  return (
    <EntityList
      items={items}
      keyExtractor={(item) => item.id}
      renderItem={(item) => <EventCard event={item} onPress={openEvent} />}
      refreshing={refreshing}
      onRefresh={() => {
        void onRefresh();
      }}
      onEndReached={onEndReached}
      isFetchingNextPage={isFetchingNextPage}
      footerSkeleton={<DiscoverCardSkeleton />}
      accessibilityLabel="Events"
    />
  );
}

export function CollectionCardList({
  items,
  refreshing,
  onRefresh,
  onEndReached,
  isFetchingNextPage,
}: DiscoverListChromeProps & { items: CollectionResponse[] }) {
  const router = useRouter();

  const openCollection = useCallback(
    (id: string) => {
      router.push(`/(app)/collection/${id}`);
    },
    [router],
  );

  return (
    <EntityList
      items={items}
      keyExtractor={(item) => item.id}
      renderItem={(item) => <CollectionCard collection={item} onPress={openCollection} />}
      refreshing={refreshing}
      onRefresh={() => {
        void onRefresh();
      }}
      onEndReached={onEndReached}
      isFetchingNextPage={isFetchingNextPage}
      footerSkeleton={<DiscoverCardSkeleton />}
      accessibilityLabel="Collections"
    />
  );
}
