import type { PostResponse } from '@gmrlog/types';
import { Button, Screen, useTheme } from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { FlatList, RefreshControl } from 'react-native';

import { useAuthStore } from '../../../src/state/auth-store';
import { useConnectivityStore } from '../../../src/state/stores';
import { ContentErrorState } from '../components/content-error-state';
import { ContentListSkeleton } from '../components/content-list-skeleton';
import { EmptyGamePosts } from '../components/empty-game-posts';
import { GameHubTabShell } from '../components/game-hub-tab-shell';
import { PostCard } from '../components/post-card';
import { useGameGuides, useGameScreenshots } from '../hooks/use-game-hub-tabs';

interface GamePostListScreenProps {
  gameId: string;
  title: string;
  kind: 'guides' | 'screenshots';
}

function GamePostListScreen({ gameId, title, kind }: GamePostListScreenProps) {
  const theme = useTheme();
  const router = useRouter();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const userId = useAuthStore((s) => s.user?.id);
  const guides = useGameGuides(gameId);
  const screenshots = useGameScreenshots(gameId);
  const data = kind === 'guides' ? guides : screenshots;

  const openCreate = () => {
    router.push({
      pathname: '/(app)/post/create',
      params: { gameId },
    });
  };

  return (
    <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
      <GameHubTabShell
        title={title}
        onBack={() => {
          router.back();
        }}
        action={
          <Button
            variant="ghost"
            size="sm"
            accessibilityLabel={`Write ${title.toLowerCase()}`}
            onPress={openCreate}
          >
            Write
          </Button>
        }
      >
        {data.status === 'loading' ? <ContentListSkeleton /> : null}
        {data.status === 'error' ? (
          <ContentErrorState
            isOffline={!isOnline}
            title={`Could not load ${title.toLowerCase()}`}
            onRetry={() => {
              void data.refetch();
            }}
          />
        ) : null}
        {data.status === 'empty' ? <EmptyGamePosts onCreate={openCreate} /> : null}
        {data.status === 'ready' ? (
          <FlatList
            data={data.items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }: { item: PostResponse }) => (
              <PostCard
                post={item}
                onPress={(id) => {
                  router.push(`/(app)/post/${id}`);
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
                refreshing={data.isRefreshing}
                onRefresh={() => {
                  void data.refresh();
                }}
                tintColor={theme.color('color.interactive.primary')}
                colors={[theme.color('color.interactive.primary')]}
              />
            }
            contentContainerStyle={{ paddingBottom: theme.space('space.8'), flexGrow: 1 }}
          />
        ) : null}
      </GameHubTabShell>
    </Screen>
  );
}

export function GameGuidesScreen({ gameId }: { gameId: string }) {
  return <GamePostListScreen gameId={gameId} title="Guides" kind="guides" />;
}

export function GameScreenshotsScreen({ gameId }: { gameId: string }) {
  return <GamePostListScreen gameId={gameId} title="Screenshots" kind="screenshots" />;
}
