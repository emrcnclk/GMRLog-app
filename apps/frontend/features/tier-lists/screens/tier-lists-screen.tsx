import { Button, Screen, useTheme } from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, RefreshControl } from 'react-native';

import { ScreenHeader } from '../../../src/navigation/screen-header';
import { useConnectivityStore } from '../../../src/state/stores';
import { EmptyTierLists } from '../components/empty-tier-lists';
import { TierErrorState } from '../components/tier-error-state';
import { TierListCard } from '../components/tier-list-card';
import { TierSkeleton } from '../components/tier-skeleton';
import { useTierLists } from '../hooks/use-tier-lists';

export function TierListsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const list = useTierLists();

  const openCreate = useCallback(() => {
    router.push('/(app)/tier-lists/create');
  }, [router]);

  const openTierList = useCallback(
    (id: string) => {
      router.push(`/(app)/tier-list/${id}`);
    },
    [router],
  );

  return (
    <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
      <ScreenHeader
        title="Tier Lists"
        onBack={() => {
          router.back();
        }}
        trailing={
          <Button
            variant="ghost"
            size="sm"
            accessibilityLabel="Create tier list"
            onPress={openCreate}
          >
            Create
          </Button>
        }
      />

      {list.status === 'loading' ? <TierSkeleton /> : null}
      {list.status === 'error' ? (
        <TierErrorState
          isOffline={!isOnline}
          onRetry={() => {
            void list.refetch();
          }}
        />
      ) : null}
      {list.status === 'empty' ? <EmptyTierLists onCreate={openCreate} /> : null}
      {list.status === 'ready' ? (
        <FlatList
          data={list.items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TierListCard tierList={item} onPress={openTierList} />}
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
          removeClippedSubviews
        />
      ) : null}
    </Screen>
  );
}
