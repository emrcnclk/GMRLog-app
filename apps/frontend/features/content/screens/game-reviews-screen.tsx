import { Button, Screen, useTheme } from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, RefreshControl } from 'react-native';

import { ScreenHeader } from '../../../src/navigation/screen-header';
import { useAuthStore } from '../../../src/state/auth-store';
import { useConnectivityStore } from '../../../src/state/stores';
import { ContentErrorState } from '../components/content-error-state';
import { ContentListSkeleton } from '../components/content-list-skeleton';
import { EmptyGameReviews } from '../components/empty-game-reviews';
import { ReviewCard } from '../components/review-card';
import { useGameReviews } from '../hooks/use-reviews';

export interface GameReviewsScreenProps {
  gameId: string;
}

export function GameReviewsScreen({ gameId }: GameReviewsScreenProps) {
  const theme = useTheme();
  const router = useRouter();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const userId = useAuthStore((s) => s.user?.id);
  const reviews = useGameReviews(gameId);

  const openCreate = useCallback(() => {
    router.push({
      pathname: '/(app)/review/create',
      params: { gameId },
    });
  }, [gameId, router]);

  const header = (
    <ScreenHeader
      title="Reviews"
      titleRole="title"
      onBack={() => {
        router.back();
      }}
      trailing={
        <Button variant="ghost" size="sm" accessibilityLabel="Write a review" onPress={openCreate}>
          Write
        </Button>
      }
    />
  );

  return (
    <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
      {header}

      {reviews.status === 'loading' ? <ContentListSkeleton /> : null}

      {reviews.status === 'error' ? (
        <ContentErrorState
          isOffline={!isOnline}
          title="Could not load reviews"
          onRetry={() => {
            void reviews.refetch();
          }}
        />
      ) : null}

      {reviews.status === 'empty' ? <EmptyGameReviews onCreate={openCreate} /> : null}

      {reviews.status === 'ready' ? (
        <FlatList
          data={reviews.items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ReviewCard
              review={item}
              onPress={(id) => {
                router.push(`/(app)/review/${id}`);
              }}
              onPressGame={(id) => {
                router.push(`/(app)/game/${id}`);
              }}
              onPressEdit={
                userId === item.author.id
                  ? (id) => {
                      router.push(`/(app)/review/${id}/edit`);
                    }
                  : undefined
              }
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={reviews.isRefreshing}
              onRefresh={() => {
                void reviews.refresh();
              }}
              tintColor={theme.color('color.interactive.primary')}
              colors={[theme.color('color.interactive.primary')]}
            />
          }
          contentContainerStyle={{ paddingBottom: theme.space('space.8'), flexGrow: 1 }}
          initialNumToRender={10}
          windowSize={7}
          removeClippedSubviews
        />
      ) : null}
    </Screen>
  );
}
