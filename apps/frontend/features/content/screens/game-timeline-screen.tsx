import type { ActivityItemResponse, FeedItemResponse } from '@gmrlog/types';
import { Screen, useTheme } from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';

import { useConnectivityStore } from '../../../src/state/stores';
import { ActivityCard } from '../../home/components/activity-card';
import { ContentErrorState } from '../components/content-error-state';
import { ContentListSkeleton } from '../components/content-list-skeleton';
import { EmptyGamePosts } from '../components/empty-game-posts';
import { GameHubTabShell } from '../components/game-hub-tab-shell';
import { useGameTimeline } from '../hooks/use-game-hub-tabs';

export interface GameTimelineScreenProps {
  gameId: string;
}

function feedItemToActivity(item: FeedItemResponse): ActivityItemResponse {
  return {
    id: item.id,
    kind: item.kind,
    createdAt: item.occurredAt,
    readAt: null,
    actor: item.actor,
    objectRef: item.object,
    messageKey: item.kind,
  };
}

export function GameTimelineScreen({ gameId }: GameTimelineScreenProps) {
  const theme = useTheme();
  const router = useRouter();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const timeline = useGameTimeline(gameId);

  const openActivity = useCallback(
    (item: ActivityItemResponse) => {
      const ref = item.objectRef;
      switch (ref.type) {
        case 'review':
          router.push(`/(app)/review/${ref.id}`);
          break;
        case 'post':
          router.push(`/(app)/post/${ref.id}`);
          break;
        case 'event':
          router.push(`/(app)/event/${ref.id}`);
          break;
        case 'collection':
          router.push(`/(app)/collection/${ref.id}`);
          break;
        case 'game':
          router.push(`/(app)/game/${ref.id}`);
          break;
        default:
          break;
      }
    },
    [router],
  );

  const items = timeline.items.map(feedItemToActivity);

  return (
    <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
      <GameHubTabShell
        title="Timeline"
        onBack={() => {
          router.back();
        }}
      >
        {timeline.isPending && items.length === 0 ? <ContentListSkeleton /> : null}
        {timeline.isError && items.length === 0 ? (
          <ContentErrorState
            isOffline={!isOnline}
            title="Could not load timeline"
            onRetry={() => {
              void timeline.refetch();
            }}
          />
        ) : null}
        {items.length === 0 && !timeline.isPending && !timeline.isError ? (
          <EmptyGamePosts onCreate={() => undefined} />
        ) : null}
        {items.length > 0 ? (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  openActivity(item);
                }}
              >
                <ActivityCard item={item} />
              </Pressable>
            )}
            refreshControl={
              <RefreshControl
                refreshing={timeline.isRefreshing}
                onRefresh={() => {
                  void timeline.refresh();
                }}
                tintColor={theme.color('color.interactive.primary')}
                colors={[theme.color('color.interactive.primary')]}
              />
            }
            onEndReached={() => {
              timeline.loadMore();
            }}
            onEndReachedThreshold={0.4}
            ListFooterComponent={
              timeline.isFetchingNextPage ? (
                <View style={{ padding: theme.space('space.4'), alignItems: 'center' }}>
                  <ContentListSkeleton rows={2} />
                </View>
              ) : null
            }
            contentContainerStyle={{ paddingBottom: theme.space('space.8'), flexGrow: 1 }}
          />
        ) : null}
      </GameHubTabShell>
    </Screen>
  );
}
