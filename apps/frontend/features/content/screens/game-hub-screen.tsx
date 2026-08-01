import type {
  FeedItemResponse,
  GameHubCollectionSummaryResponse,
  ReviewResponse,
} from '@gmrlog/types';
import { EmptyState, HeroBackButton, ListItem, Screen, SegmentedTabs, useTheme } from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Linking, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useConnectivityStore } from '../../../src/state/stores';
import { useSimilarGames } from '../../discover/hooks/use-discover';
import { ContentErrorState } from '../components/content-error-state';
import { ContentListSkeleton } from '../components/content-list-skeleton';
import { GameActivityRow } from '../components/game-hub/game-activity-row';
import { GameHero } from '../components/game-hub/game-hero';
import { GameMediaGrid, GameVideoList } from '../components/game-hub/game-media-grid';
import { GameOverviewTab } from '../components/game-hub/game-overview-tab';
import { GameRecommendationsTab } from '../components/game-hub/game-recommendations-tab';
import { ReviewCard } from '../components/review-card';
import {
  bucketGameMedia,
  buildGameHubTabs,
  GAME_HUB_TAB_LABELS,
  gameHubEmptyCopy,
  isGameHubBlockTab,
  type GameHubTabId,
} from '../hooks/game-detail-model';
import { useGameDetail, useGameMedia, useGameRelated } from '../hooks/use-game-detail';
import { useGameHub } from '../hooks/use-game-hub';
import { useGameHubCollections, useGameTimeline } from '../hooks/use-game-hub-tabs';
import { useGameReviews } from '../hooks/use-reviews';

export interface GameHubScreenProps {
  gameId: string;
}

/**
 * One row shape per list-bearing tab.
 *
 * The hub renders every tab through a single `FlatList` rather than swapping
 * whole scroll containers, so the hero and tab strip stay mounted across a tab
 * change and scroll position is never thrown away. That means one `data` array
 * has to carry three different entities — hence the discriminated union.
 */
type HubRow =
  | { kind: 'activity'; key: string; item: FeedItemResponse }
  | { kind: 'review'; key: string; item: ReviewResponse }
  | { kind: 'collection'; key: string; item: GameHubCollectionSummaryResponse };

/**
 * Game Hub — hero artwork, identity block, and seven sections over one
 * virtualized list (D3.27 · `docs/07_SOCIAL/GAME_HUB.md`).
 *
 * The screen owns no card markup and no formatting rules: every visual belongs
 * to `@gmrlog/ui` or a `components/game-hub/*` part, and every derived string
 * comes from `game-detail-model`. What is left here is composition — which read
 * feeds which tab, and what the list shows while they are in flight.
 */
export function GameHubScreen({ gameId }: GameHubScreenProps) {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const [activeTab, setActiveTab] = useState<GameHubTabId>('overview');

  const detail = useGameDetail(gameId);
  const media = useGameMedia(gameId);
  const related = useGameRelated(gameId);
  const hub = useGameHub(gameId);
  const similar = useSimilarGames(gameId);
  const timeline = useGameTimeline(gameId);
  const reviews = useGameReviews(gameId);
  const collections = useGameHubCollections(gameId);

  const game = detail.game;
  const gameTitle = game?.title ?? 'Game';
  const screenshotsInline = game?.screenshots;

  const { screenshots, videos } = useMemo(
    () => bucketGameMedia(media.media, screenshotsInline ?? []),
    [media.media, screenshotsInline],
  );

  const tabs = useMemo(
    () =>
      buildGameHubTabs({
        hub: hub.hub,
        videoCount: videos.length,
        screenshotCount: screenshots.length,
        recommendationCount: related.related.length + similar.items.length,
      }),
    [hub.hub, videos.length, screenshots.length, related.related.length, similar.items.length],
  );

  const openGame = useCallback(
    (id: string) => {
      router.push(`/(app)/game/${id}`);
    },
    [router],
  );

  const openUser = useCallback(
    (userId: string) => {
      router.push(`/(app)/user/${userId}`);
    },
    [router],
  );

  const openReview = useCallback(
    (reviewId: string) => {
      router.push(`/(app)/review/${reviewId}`);
    },
    [router],
  );

  const openCollection = useCallback(
    (collectionId: string) => {
      router.push(`/(app)/collection/${collectionId}`);
    },
    [router],
  );

  const writeReview = useCallback(() => {
    router.push({ pathname: '/(app)/review/create', params: { gameId } });
  }, [gameId, router]);

  const writePost = useCallback(() => {
    router.push({ pathname: '/(app)/post/create', params: { gameId } });
  }, [gameId, router]);

  const openUrl = useCallback((url: string) => {
    void Linking.openURL(url);
  }, []);

  const rows: HubRow[] = useMemo(() => {
    switch (activeTab) {
      case 'activity':
        return timeline.items.map((item) => ({
          kind: 'activity' as const,
          key: `activity-${item.id}`,
          item,
        }));
      case 'reviews':
        return reviews.items.map((item) => ({
          kind: 'review' as const,
          key: `review-${item.id}`,
          item,
        }));
      case 'collections':
        return collections.items.map((item) => ({
          kind: 'collection' as const,
          key: `collection-${item.id}`,
          item,
        }));
      default:
        return [];
    }
  }, [activeTab, collections.items, reviews.items, timeline.items]);

  const renderRow = useCallback(
    ({ item: row }: { item: HubRow }) => {
      switch (row.kind) {
        case 'activity':
          return <GameActivityRow item={row.item} onPressGame={openGame} onPressUser={openUser} />;
        case 'review':
          return <ReviewCard review={row.item} onPress={openReview} onPressGame={openGame} />;
        case 'collection':
          return (
            <ListItem
              title={row.item.title}
              subtitle={`Curated by ${row.item.owner.displayName}`}
              accessibilityLabel={`${row.item.title}, curated by ${row.item.owner.displayName}`}
              onPress={() => {
                openCollection(row.item.id);
              }}
            />
          );
        default: {
          const _exhaustive: never = row;
          return _exhaustive;
        }
      }
    },
    [openCollection, openGame, openReview, openUser],
  );

  /** Whether the active tab's own read is still resolving. */
  const isTabPending = ((): boolean => {
    switch (activeTab) {
      case 'activity':
        return timeline.isPending;
      case 'reviews':
        return reviews.status === 'loading';
      case 'collections':
        return collections.status === 'loading';
      default:
        return false;
    }
  })();

  const refresh = useCallback(() => {
    void detail.refresh();
    void hub.refresh();
    switch (activeTab) {
      case 'activity':
        void timeline.refresh();
        break;
      case 'reviews':
        void reviews.refresh();
        break;
      case 'collections':
        void collections.refresh();
        break;
      default:
        break;
    }
  }, [activeTab, collections, detail, hub, reviews, timeline]);

  const header = (
    <View>
      <GameHero game={game} media={media.media} isPending={detail.isPending} />
      <SegmentedTabs
        items={tabs}
        activeId={activeTab}
        onChange={setActiveTab}
        accessibilityLabel={`${gameTitle} sections`}
        style={{ marginTop: theme.space('space.4') }}
      />
    </View>
  );

  /**
   * Block tabs render here rather than as list data: a grid, a rail set, and a
   * prose column are each single units with their own internal layout, and
   * splitting them into rows would virtualize them into incoherence.
   */
  const footer = ((): React.ReactElement | null => {
    if (isTabPending && rows.length === 0 && !isGameHubBlockTab(activeTab)) {
      return <ContentListSkeleton />;
    }

    switch (activeTab) {
      case 'overview':
        return (
          <GameOverviewTab
            game={game}
            screenshots={screenshots}
            isPending={detail.isPending}
            onSeeAllScreenshots={() => {
              setActiveTab('screenshots');
            }}
            onWriteReview={writeReview}
            onWritePost={writePost}
          />
        );
      case 'screenshots':
        return (
          <GameMediaGrid
            items={screenshots}
            isPending={media.isPending}
            gameTitle={gameTitle}
            emptyTitle="No screenshots yet"
            emptyDescription={`The catalog has not mirrored any artwork for ${gameTitle}.`}
          />
        );
      case 'videos':
        return (
          <GameVideoList
            items={videos}
            trailerUrl={game?.trailerUrl ?? null}
            isPending={media.isPending}
            gameTitle={gameTitle}
            onOpenUrl={openUrl}
          />
        );
      case 'recommendations':
        return (
          <GameRecommendationsTab
            related={related.related}
            similar={similar.items}
            isPending={related.isPending || similar.isPending}
            onPressGame={openGame}
          />
        );
      case 'activity':
        return timeline.isFetchingNextPage ? <ContentListSkeleton rows={2} /> : null;
      default:
        return null;
    }
  })();

  /** Only list-bearing tabs can be empty; block tabs carry their own copy. */
  const emptyCopy = gameHubEmptyCopy(activeTab, gameTitle);
  const empty = isGameHubBlockTab(activeTab) ? null : (
    <EmptyState
      icon={emptyCopy.icon}
      title={`No ${GAME_HUB_TAB_LABELS[activeTab].toLowerCase()} yet`}
      description={emptyCopy.description}
    />
  );

  if (detail.isError && game === null) {
    return (
      <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
        <HeroBackButton
          topInset={insets.top}
          onPress={() => {
            router.back();
          }}
        />
        <ContentErrorState
          isOffline={!isOnline}
          title="Could not load this game"
          onRetry={() => {
            void detail.refetch();
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
      <HeroBackButton
        topInset={insets.top}
        onPress={() => {
          router.back();
        }}
      />

      <FlatList
        data={rows}
        keyExtractor={(row) => row.key}
        renderItem={renderRow}
        ListHeaderComponent={header}
        ListEmptyComponent={isTabPending ? null : empty}
        ListFooterComponent={
          <View style={{ paddingBottom: theme.space('space.8') }}>{footer}</View>
        }
        onEndReached={activeTab === 'activity' ? timeline.loadMore : undefined}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={detail.isRefreshing}
            onRefresh={refresh}
            tintColor={theme.color('color.interactive.primary')}
            colors={[theme.color('color.interactive.primary')]}
            // The hero runs under the status bar, so the spinner must clear it.
            progressViewOffset={insets.top}
          />
        }
        contentContainerStyle={{ flexGrow: 1 }}
        accessibilityRole="list"
        accessibilityLabel={`${gameTitle} ${GAME_HUB_TAB_LABELS[activeTab].toLowerCase()}`}
        removeClippedSubviews
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={9}
      />
    </Screen>
  );
}
