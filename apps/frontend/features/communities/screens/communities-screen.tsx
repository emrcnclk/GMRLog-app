import { Button, Screen, useTheme } from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, RefreshControl } from 'react-native';

import { ScreenHeader } from '../../../src/navigation/screen-header';
import { useConnectivityStore } from '../../../src/state/stores';
import { CommunityCard } from '../components/community-card';
import { CommunityErrorState } from '../components/community-error-state';
import { CommunitySkeleton } from '../components/community-skeleton';
import { EmptyCommunities } from '../components/empty-communities';
import { useCommunities } from '../hooks/use-communities';

/** Communities index — GET /communities (array · backend order). */
export function CommunitiesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const list = useCommunities();

  const openCreate = useCallback(() => {
    router.push('/(app)/communities/create');
  }, [router]);

  const openDiscover = useCallback(() => {
    router.push('/(app)/(tabs)/discover/communities');
  }, [router]);

  const openCommunity = useCallback(
    (id: string) => {
      router.push(`/(app)/community/${id}`);
    },
    [router],
  );

  return (
    <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
      <ScreenHeader
        title="Communities"
        onBack={() => {
          router.back();
        }}
        trailing={
          <Button
            variant="ghost"
            size="sm"
            accessibilityLabel="Create community"
            onPress={openCreate}
          >
            Create
          </Button>
        }
      />

      {list.status === 'loading' ? <CommunitySkeleton /> : null}

      {list.status === 'error' ? (
        <CommunityErrorState
          isOffline={!isOnline}
          onRetry={() => {
            void list.refetch();
          }}
        />
      ) : null}

      {list.status === 'empty' ? (
        <EmptyCommunities onCreate={openCreate} onDiscover={openDiscover} />
      ) : null}

      {list.status === 'ready' ? (
        <FlatList
          data={list.items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CommunityCard community={item} onPress={openCommunity} />}
          refreshControl={
            <RefreshControl
              refreshing={list.isRefreshing}
              onRefresh={() => {
                void list.refresh();
              }}
              tintColor={theme.color('color.interactive.primary')}
              colors={[theme.color('color.interactive.primary')]}
            />
          }
          contentContainerStyle={{ flexGrow: 1, paddingBottom: theme.space('space.8') }}
          accessibilityRole="list"
          initialNumToRender={10}
          windowSize={9}
          maxToRenderPerBatch={12}
          removeClippedSubviews
        />
      ) : null}
    </Screen>
  );
}
