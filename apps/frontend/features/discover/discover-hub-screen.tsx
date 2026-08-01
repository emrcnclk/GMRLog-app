import { Rail, Screen, useTheme } from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, RefreshControl } from 'react-native';

import { ScreenHeader } from '../../src/navigation/screen-header';
import { useConnectivityStore } from '../../src/state/stores';

import { DiscoverErrorState } from './components/discover-error-state';
import { DiscoverHubSkeleton } from './components/discover-skeleton';
import { EmptyDiscover } from './components/empty-discover';
import { GamePosterCard } from './components/game-poster-card';
import type { DiscoverRailModel } from './hooks/discover-sections-model';
import { useDiscoverRails } from './hooks/use-discover-rails';

/** Tiles in the first rail that are worth fetching eagerly. */
const EAGER_TILES = 3;

/**
 * Discover — ten rails of artwork over one virtualized list (D3.28 Phase 1).
 *
 * The previous hub was a vertical stack of link cards: a table of contents that
 * made you tap before you could see a single game. This screen puts the games
 * themselves on the surface, and keeps the dedicated list screens behind each
 * rail's "See all" so nothing that D3.22 built becomes unreachable.
 *
 * Rails come from `useDiscoverRails`; empty ones are dropped upstream, so
 * anything rendered here has content.
 */
export function DiscoverHubScreen() {
  const router = useRouter();
  const theme = useTheme();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const discover = useDiscoverRails();

  const openGame = useCallback(
    (gameId: string) => {
      router.push(`/(app)/game/${gameId}`);
    },
    [router],
  );

  const renderRail = useCallback(
    ({ item, index }: { item: DiscoverRailModel; index: number }) => (
      <Rail
        title={item.title}
        subtitle={item.subtitle}
        actionLabel={item.href === null ? undefined : 'See all'}
        onPressAction={
          item.href === null
            ? undefined
            : () => {
                router.push(item.href as never);
              }
        }
      >
        {item.games.map((game, tileIndex) => (
          <GamePosterCard
            key={`${item.id}-${game.id}`}
            game={game}
            onPress={openGame}
            // Only the first rail is on screen at mount; the rest can wait.
            priority={index === 0 && tileIndex < EAGER_TILES ? 'high' : 'low'}
          />
        ))}
      </Rail>
    ),
    [openGame, router],
  );

  const refreshControl = (
    <RefreshControl
      refreshing={discover.isRefreshing}
      onRefresh={() => {
        void discover.refresh();
      }}
      tintColor={theme.color('color.interactive.primary')}
      colors={[theme.color('color.interactive.primary')]}
    />
  );

  return (
    <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
      <ScreenHeader title="Discover" />

      {discover.status === 'loading' ? <DiscoverHubSkeleton /> : null}

      {discover.status === 'error' ? (
        <DiscoverErrorState
          isOffline={!isOnline}
          onRetry={() => {
            discover.refetch();
          }}
        />
      ) : null}

      {discover.status === 'empty' ? (
        <EmptyDiscover
          title="Nothing to discover yet"
          description="As the catalog fills and your friends start playing, this is where it lands."
          showBrowseAction
        />
      ) : null}

      {discover.status === 'ready' ? (
        <FlatList
          data={discover.rails}
          keyExtractor={(rail) => rail.id}
          renderItem={renderRail}
          refreshControl={refreshControl}
          contentContainerStyle={{
            paddingVertical: theme.space('space.4'),
            gap: theme.space('space.6'),
            paddingBottom: theme.space('space.10'),
          }}
          accessibilityRole="list"
          accessibilityLabel="Discover shelves"
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          // A rail is expensive (12 images); render barely more than fits.
          initialNumToRender={2}
          maxToRenderPerBatch={2}
          windowSize={5}
        />
      ) : null}
    </Screen>
  );
}
