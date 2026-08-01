import { Button, Screen, useTheme } from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, RefreshControl } from 'react-native';

import { ScreenHeader } from '../../../src/navigation/screen-header';
import { useAuthStore } from '../../../src/state/auth-store';
import { useConnectivityStore } from '../../../src/state/stores';
import { ContentErrorState } from '../components/content-error-state';
import { ContentListSkeleton } from '../components/content-list-skeleton';
import { EmptyGamePosts } from '../components/empty-game-posts';
import { PostCard } from '../components/post-card';
import { useGamePosts } from '../hooks/use-posts';

export interface GamePostsScreenProps {
  gameId: string;
}

export function GamePostsScreen({ gameId }: GamePostsScreenProps) {
  const theme = useTheme();
  const router = useRouter();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const userId = useAuthStore((s) => s.user?.id);
  const posts = useGamePosts(gameId);

  const openCreate = useCallback(() => {
    router.push({
      pathname: '/(app)/post/create',
      params: { gameId },
    });
  }, [gameId, router]);

  const header = (
    <ScreenHeader
      title="Posts"
      titleRole="title"
      onBack={() => {
        router.back();
      }}
      trailing={
        <Button variant="ghost" size="sm" accessibilityLabel="Write a post" onPress={openCreate}>
          Write
        </Button>
      }
    />
  );

  return (
    <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
      {header}

      {posts.status === 'loading' ? <ContentListSkeleton /> : null}

      {posts.status === 'error' ? (
        <ContentErrorState
          isOffline={!isOnline}
          title="Could not load posts"
          onRetry={() => {
            void posts.refetch();
          }}
        />
      ) : null}

      {posts.status === 'empty' ? <EmptyGamePosts onCreate={openCreate} /> : null}

      {posts.status === 'ready' ? (
        <FlatList
          data={posts.items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onPress={(id) => {
                router.push(`/(app)/post/${id}`);
              }}
              onPressGame={(id) => {
                router.push(`/(app)/game/${id}`);
              }}
              onPressEdit={
                userId === item.author.id
                  ? (id) => {
                      router.push(`/(app)/post/${id}/edit`);
                    }
                  : undefined
              }
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={posts.isRefreshing}
              onRefresh={() => {
                void posts.refresh();
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
