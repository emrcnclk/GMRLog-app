import {
  Icon,
  MIN_TOUCH_TARGET,
  Rail,
  SCREEN_GUTTER,
  Screen,
  ScreenTitle,
  Text,
  useTheme,
} from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';

import { useConnectivityStore } from '../../src/state/stores';

import { DiscoverErrorState } from './components/discover-error-state';
import { DiscoverHubSkeleton } from './components/discover-skeleton';
import { DnaPeersRail } from './components/dna-peers-rail';
import { EmptyDiscover } from './components/empty-discover';
import { GamePosterCard } from './components/game-poster-card';
import { GenreChipsRow } from './components/genre-chips-row';
import {
  selectGenreChips,
  type DiscoverGenreChip,
  type DiscoverRailModel,
} from './hooks/discover-sections-model';
import { useDiscoverRails } from './hooks/use-discover-rails';

/** Tiles in the first rail that are worth fetching eagerly. */
const EAGER_TILES = 3;

/**
 * Discover — search-first chrome (`SCREEN_REDESIGNS.md` §7) over the ten-rail
 * shelf list underneath (D3.28 Phase 1), kept exactly as it was.
 *
 * §7's own bullets ("Screen title, then search... then a rhythm of rails")
 * read as compatible with, not a replacement for, the existing rails: every
 * rail here is a real, working query (`useDiscoverRails`), and nothing about
 * this task's "layout only" scope justifies deleting six of them to match a
 * flatter mock. The sponsored card has no data behind it anywhere in this
 * API — not even a reserved field — so it is not built; see `TASKS.md` 3.7
 * for the backend follow-up this needs before it can be real.
 *
 * **"Plays like you" (6.2) sits above the game rails, not inside the
 * `FlatList`.** It is "the first content on the screen, deliberately: people
 * before games" (§7), which means it has to render before the games query
 * even resolves — `useDiscoverRails`' loading/error/empty branches replace
 * the `FlatList` entirely, and a rail nested inside that list would vanish
 * along with it. `DnaPeersRail` runs its own independent query and owns its
 * own three states.
 *
 * The search field is a navigation trigger, not an inline filter: there is no
 * free-text search parameter on `GET /discover/games`, and the app already
 * has a real server-searched Search tab (the same shortcut Home's header
 * search icon already uses). Genre chips are real, though — they're a
 * projection over whichever rail games are already loaded (no
 * `/discover/genres` endpoint exists) and tapping one navigates to the games
 * list filtered by the real `genreId` param that endpoint already accepts.
 */
export function DiscoverHubScreen() {
  const router = useRouter();
  const theme = useTheme();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const discover = useDiscoverRails();

  const genreChips = useMemo(() => selectGenreChips(discover.rails), [discover.rails]);

  const openGame = useCallback(
    (gameId: string) => {
      router.push(`/(app)/game/${gameId}`);
    },
    [router],
  );

  const openUser = useCallback(
    (userId: string) => {
      router.push(`/(app)/user/${userId}`);
    },
    [router],
  );

  const openSearch = useCallback(() => {
    router.push('/(app)/(tabs)/search');
  }, [router]);

  const openGenre = useCallback(
    (genre: DiscoverGenreChip) => {
      router.push({
        pathname: '/(app)/(tabs)/discover/games',
        params: { genreId: genre.id, genreName: genre.name },
      });
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
    <Screen edges={['top']} style={{ paddingBottom: 0 }}>
      <ScreenTitle title="Discover" />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Search games, communities, and people"
        onPress={openSearch}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.space('space.2'),
          minHeight: MIN_TOUCH_TARGET,
          marginHorizontal: theme.space(SCREEN_GUTTER),
          marginBottom: theme.space('space.4'),
          paddingHorizontal: theme.space('space.3'),
          borderRadius: theme.radius('radius.md'),
          backgroundColor: theme.color('color.surface.secondary'),
        }}
      >
        <Icon name="search" decorative size={18} color="color.text.tertiary" />
        <Text role="body" color="color.text.tertiary">
          Search games, communities, people
        </Text>
      </Pressable>

      <View style={{ marginBottom: theme.space('space.6') }}>
        <DnaPeersRail onPressUser={openUser} />
      </View>

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
          ListHeaderComponent={
            genreChips.length > 0 ? (
              <GenreChipsRow genres={genreChips} onSelectGenre={openGenre} />
            ) : null
          }
          refreshControl={refreshControl}
          contentContainerStyle={{
            paddingTop: theme.space('space.4'),
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
