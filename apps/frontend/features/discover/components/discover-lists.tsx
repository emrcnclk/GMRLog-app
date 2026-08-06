import type {
  CollectionResponse,
  CommunityResponse,
  EventResponse,
  GameCardResponse,
} from '@gmrlog/types';
import { EntityList } from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { CollectionCard } from '../../collections/components/collection-card';
import { CommunityCard } from '../../communities/components/community-card';
import { EventCard } from '../../events/components/event-card';

import { DiscoverCardSkeleton } from './discover-skeleton';
import { GameCard } from './game-card';

interface DiscoverListChromeProps {
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
  onEndReached: () => void;
  isFetchingNextPage: boolean;
}

/**
 * Full-catalog game browse — "result rows: cover, title, meta, rating"
 * (`SCREEN_REDESIGNS.md` §7), a hairline-separated list rather than the poster
 * grid this rendered before 3.7. `GameCard` already had exactly this row shape
 * built (D3.28) but was never wired to a real list — the poster grid used
 * `GamePosterCard` instead. These four lists render through `EntityList`, so
 * scroll physics, refresh tint, pagination threshold, footer treatment, and
 * list semantics are defined once in the design system.
 */
export function GameCardList({
  items,
  refreshing,
  onRefresh,
  onEndReached,
  isFetchingNextPage,
}: DiscoverListChromeProps & { items: GameCardResponse[] }) {
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
      renderItem={(item) => <GameCard game={item} onPress={openGame} />}
      refreshing={refreshing}
      onRefresh={() => {
        void onRefresh();
      }}
      onEndReached={onEndReached}
      isFetchingNextPage={isFetchingNextPage}
      footerSkeleton={<DiscoverCardSkeleton />}
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
