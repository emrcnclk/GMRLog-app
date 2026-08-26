import type { GameHubPlayerResponse, PostResponse, ReviewResponse } from '@gmrlog/types';
import {
  Avatar,
  DistributionBars,
  EmptyState,
  HeroBackButton,
  IconButton,
  Icon,
  ListItem,
  Screen,
  SegmentedTabs,
  Text,
  useTheme,
} from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { MoreHorizontal } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Linking, RefreshControl, Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore } from '../../../src/state/auth-store';
import { useConnectivityStore } from '../../../src/state/stores';
import { useSimilarGames } from '../../discover/hooks/use-discover';
import { useOnlineFriends } from '../../friends/hooks/use-friends';
import { ContentErrorState } from '../components/content-error-state';
import { ContentListSkeleton } from '../components/content-list-skeleton';
import { CompletionDialog } from '../components/game-hub/completion-dialog';
import { GameAboutTab } from '../components/game-hub/game-about-tab';
import { GameCommunityTab } from '../components/game-hub/game-community-tab';
import { GameHero } from '../components/game-hub/game-hero';
import { GameRecommendationsTab } from '../components/game-hub/game-recommendations-tab';
import { PostCard } from '../components/post-card';
import { ReviewCard } from '../components/review-card';
import { selectOnlineFriendsPlaying } from '../hooks/game-community-model';
import {
  bucketGameMedia,
  bucketReviewDistribution,
  buildGameHubTabs,
  GAME_HUB_TAB_LABELS,
  gameHubEmptyCopy,
  isGameHubBlockTab,
  LIBRARY_STATUS_LABELS,
  type GameHubTabId,
} from '../hooks/game-detail-model';
import { useGameDetail, useGameMedia, useGameRelated } from '../hooks/use-game-detail';
import { useGameHub } from '../hooks/use-game-hub';
import {
  useGameGuides,
  useGameHubCollections,
  useGameHubPlayers,
  useGameTimeline,
} from '../hooks/use-game-hub-tabs';
import { useSetCompletionPercent } from '../hooks/use-library-completion';
import { useGameReviews } from '../hooks/use-reviews';

export interface GameHubScreenProps {
  gameId: string;
}

const LIVE_ACTIVITY_LIMIT = 5;

/**
 * One row shape per list-bearing tab (Reviews / Workshop / Players).
 *
 * The hub renders every list-bearing tab through a single `FlatList` rather
 * than swapping whole scroll containers, so the hero and tab strip stay
 * mounted across a tab change and scroll position is never thrown away.
 * That means one `data` array has to carry three different entities — hence
 * the discriminated union.
 */
type HubRow =
  | { kind: 'review'; key: string; item: ReviewResponse }
  | { kind: 'post'; key: string; item: PostResponse }
  | { kind: 'player'; key: string; item: GameHubPlayerResponse };

/**
 * Game Hub — the cinematic overlap hero, over one virtualized list (§5).
 *
 * The screen owns no card markup and no formatting rules: every visual belongs
 * to `@gmrlog/ui` or a `components/game-hub/*` part, and every derived string
 * comes from `game-detail-model` / `game-community-model`. What is left here is
 * composition — which read feeds which tab, and what the list shows while
 * they are in flight.
 */
export function GameHubScreen({ gameId }: GameHubScreenProps) {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const userId = useAuthStore((s) => s.user?.id);
  const [activeTab, setActiveTab] = useState<GameHubTabId>('about');

  const detail = useGameDetail(gameId);
  const media = useGameMedia(gameId);
  const related = useGameRelated(gameId);
  const hub = useGameHub(gameId);
  const similar = useSimilarGames(gameId);
  const timeline = useGameTimeline(gameId);
  const reviews = useGameReviews(gameId);
  const collections = useGameHubCollections(gameId);
  const guides = useGameGuides(gameId);
  const players = useGameHubPlayers(gameId);
  const onlineFriends = useOnlineFriends();

  const game = detail.game;
  const gameTitle = game?.title ?? 'Game';
  const screenshotsInline = game?.screenshots;

  const { screenshots, videos } = useMemo(
    () => bucketGameMedia(media.media, screenshotsInline ?? []),
    [media.media, screenshotsInline],
  );

  const onlineFriendsPlaying = useMemo(
    () => selectOnlineFriendsPlaying(onlineFriends.friends, players.items),
    [onlineFriends.friends, players.items],
  );

  const reviewDistribution = useMemo(
    () => bucketReviewDistribution(reviews.items),
    [reviews.items],
  );

  const tabs = useMemo(
    () =>
      buildGameHubTabs({
        hub: hub.hub,
        recommendationCount: related.related.length + similar.items.length,
      }),
    [hub.hub, related.related.length, similar.items.length],
  );

  const openGame = useCallback(
    (id: string) => {
      router.push(`/(app)/game/${id}`);
    },
    [router],
  );

  const openUser = useCallback(
    (userId2: string) => {
      router.push(`/(app)/user/${userId2}`);
    },
    [router],
  );

  const openReview = useCallback(
    (reviewId: string) => {
      router.push(`/(app)/review/${reviewId}`);
    },
    [router],
  );

  const openPost = useCallback(
    (postId: string) => {
      router.push(`/(app)/post/${postId}`);
    },
    [router],
  );

  const openCollection = useCallback(
    (collectionId: string) => {
      router.push(`/(app)/collection/${collectionId}`);
    },
    [router],
  );

  const openScreenshots = useCallback(() => {
    router.push(`/(app)/game/${gameId}/screenshots`);
  }, [gameId, router]);

  const writeReview = useCallback(() => {
    router.push({ pathname: '/(app)/review/create', params: { gameId } });
  }, [gameId, router]);

  const writePost = useCallback(() => {
    router.push({ pathname: '/(app)/post/create', params: { gameId } });
  }, [gameId, router]);

  // 13.1 — the completion editor. Dialog state lives on the screen rather than
  // inside the hero so the hero stays a renderer, the same split every other
  // action on it already follows.
  const [completionOpen, setCompletionOpen] = useState(false);
  const setCompletion = useSetCompletionPercent(gameId);
  const openCompletion = useCallback(() => {
    setCompletion.reset();
    setCompletionOpen(true);
  }, [setCompletion]);
  const saveCompletion = useCallback(
    (percent: number | null) => {
      const shelf = game?.library?.status;
      if (shelf === undefined) {
        return;
      }
      setCompletion.mutate(
        { status: shelf, completionPercent: percent },
        {
          onSuccess: () => {
            setCompletionOpen(false);
          },
        },
      );
    },
    [game, setCompletion],
  );

  const openUrl = useCallback((url: string) => {
    void Linking.openURL(url);
  }, []);

  const shareGame = useCallback(() => {
    void Share.share({ message: gameTitle, title: gameTitle });
  }, [gameTitle]);

  const rows: HubRow[] = useMemo(() => {
    switch (activeTab) {
      case 'reviews':
        return reviews.items.map((item) => ({
          kind: 'review' as const,
          key: `review-${item.id}`,
          item,
        }));
      case 'workshop':
        return guides.items.map((item) => ({
          kind: 'post' as const,
          key: `post-${item.id}`,
          item,
        }));
      case 'players':
        return players.items.map((item) => ({
          kind: 'player' as const,
          key: `player-${item.user.id}`,
          item,
        }));
      default:
        return [];
    }
  }, [activeTab, guides.items, players.items, reviews.items]);

  const renderRow = useCallback(
    ({ item: row }: { item: HubRow }) => {
      switch (row.kind) {
        case 'review':
          return <ReviewCard review={row.item} onPress={openReview} onPressGame={openGame} />;
        case 'post':
          return (
            <PostCard
              post={row.item}
              onPress={openPost}
              onPressGame={openGame}
              onPressEdit={userId === row.item.author.id ? openPost : undefined}
            />
          );
        case 'player':
          return (
            <ListItem
              title={row.item.user.displayName}
              subtitle={`@${row.item.user.handle}`}
              accessibilityLabel={`${row.item.user.displayName}, ${LIBRARY_STATUS_LABELS[row.item.status]}`}
              leading={
                <Avatar
                  size="md"
                  uri={row.item.user.avatarUrl ?? undefined}
                  accessibilityLabel={`${row.item.user.displayName} avatar`}
                />
              }
              trailing={
                <Text role="meta" color="color.text.tertiary">
                  {LIBRARY_STATUS_LABELS[row.item.status]}
                </Text>
              }
              onPress={() => {
                openUser(row.item.user.id);
              }}
            />
          );
        default: {
          const _exhaustive: never = row;
          return _exhaustive;
        }
      }
    },
    [openGame, openPost, openReview, openUser, userId],
  );

  /** Whether the active tab's own read is still resolving. */
  const isTabPending = ((): boolean => {
    switch (activeTab) {
      case 'reviews':
        return reviews.status === 'loading';
      case 'workshop':
        return guides.status === 'loading';
      case 'players':
        return players.status === 'loading';
      default:
        return false;
    }
  })();

  const refresh = useCallback(() => {
    void detail.refresh();
    void hub.refresh();
    switch (activeTab) {
      case 'reviews':
        void reviews.refresh();
        break;
      case 'workshop':
        void guides.refresh();
        break;
      case 'players':
        void players.refresh();
        break;
      case 'community':
        void collections.refresh();
        void timeline.refresh();
        break;
      default:
        break;
    }
  }, [activeTab, collections, detail, guides, hub, players, reviews, timeline]);

  const header = (
    <View>
      <GameHero
        game={game}
        media={media.media}
        hub={hub.hub}
        isPending={detail.isPending}
        onWriteReview={writeReview}
        onWritePost={writePost}
        onSetCompletion={openCompletion}
      />
      <SegmentedTabs
        items={tabs}
        activeId={activeTab}
        onChange={setActiveTab}
        accessibilityLabel={`${gameTitle} sections`}
        style={{ marginTop: theme.space('space.4') }}
      />
      {activeTab === 'reviews' ? (
        <View
          style={{
            paddingHorizontal: theme.space('space.4'),
            paddingTop: theme.space('space.4'),
          }}
        >
          <DistributionBars
            rows={reviewDistribution}
            barHeight={3}
            accessibilityLabel={`${gameTitle} rating distribution`}
          />
        </View>
      ) : null}
    </View>
  );

  /**
   * Block tabs render here rather than as list data: a prose column, a set of
   * community sections, and a rail grid are each single units with their own
   * internal layout, and splitting them into rows would virtualize them into
   * incoherence.
   */
  const footer = ((): React.ReactElement | null => {
    if (isTabPending && rows.length === 0 && !isGameHubBlockTab(activeTab)) {
      return <ContentListSkeleton />;
    }

    switch (activeTab) {
      case 'about':
        return (
          <GameAboutTab
            game={game}
            screenshots={screenshots}
            videos={videos}
            trailerUrl={game?.trailerUrl ?? null}
            isPending={detail.isPending}
            onSeeAllScreenshots={openScreenshots}
            onOpenUrl={openUrl}
          />
        );
      case 'community':
        return (
          <GameCommunityTab
            gameTitle={gameTitle}
            onlineFriendsPlaying={onlineFriendsPlaying}
            isFriendsPending={onlineFriends.isPending || players.status === 'loading'}
            onPressFriend={openUser}
            collections={collections.items}
            isCollectionsPending={collections.status === 'loading'}
            onPressCollection={openCollection}
            activity={timeline.items.slice(0, LIVE_ACTIVITY_LIMIT)}
            isActivityPending={timeline.isPending}
            onPressGame={openGame}
            onPressUser={openUser}
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
      <Screen edges={[]}>
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
    <Screen edges={[]}>
      <HeroBackButton
        topInset={insets.top}
        onPress={() => {
          router.back();
        }}
        trailing={
          <View style={{ flexDirection: 'row', gap: theme.space('space.2') }}>
            <IconButton
              accessibilityLabel="Share"
              size="lg"
              onPress={shareGame}
              hitSlop={8}
              style={{
                margin: theme.space('space.3'),
                backgroundColor: theme.color('color.scrim.strong'),
              }}
            >
              <Icon
                name="share-2"
                decorative
                size={theme.space('space.6')}
                color="color.scrim.foreground"
              />
            </IconButton>
            {/*
              Overflow: §5 asks for a third floating button here, but no
              destination or action set is defined anywhere in the docs or
              the app for it. Rendered as decoration only (not a `Pressable`,
              hidden from assistive tech) rather than a button that does
              nothing when tapped — the same "chevron is composition only"
              call 3.2's ProCard already made.
            */}
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={{
                width: theme.space('space.12'),
                height: theme.space('space.12'),
                margin: theme.space('space.3'),
                borderRadius: theme.radius('radius.full'),
                backgroundColor: theme.color('color.scrim.strong'),
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MoreHorizontal
                size={theme.space('space.6')}
                color={theme.color('color.scrim.foreground')}
              />
            </View>
          </View>
        }
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

      {game?.library !== null && game?.library !== undefined ? (
        <CompletionDialog
          visible={completionOpen}
          status={game.library.status}
          current={game.library.completionPercent ?? null}
          saving={setCompletion.isPending}
          error={setCompletion.isError ? 'Could not save that. Try again.' : null}
          onClose={() => {
            setCompletionOpen(false);
          }}
          onSave={saveCompletion}
        />
      ) : null}
    </Screen>
  );
}
