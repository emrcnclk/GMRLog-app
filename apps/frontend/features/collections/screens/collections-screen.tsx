import { Button, Screen, useTheme } from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, RefreshControl } from 'react-native';

import { ScreenHeader } from '../../../src/navigation/screen-header';
import { useConnectivityStore } from '../../../src/state/stores';
import { CollectionCard } from '../components/collection-card';
import { CollectionErrorState } from '../components/collection-error-state';
import { CollectionSkeleton } from '../components/collection-skeleton';
import { EmptyCollections } from '../components/empty-collections';
import { useCollections } from '../hooks/use-collections';

export function CollectionsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const list = useCollections();

  const openCreate = useCallback(() => {
    router.push('/(app)/collections/create');
  }, [router]);

  const openCollection = useCallback(
    (id: string) => {
      router.push(`/(app)/collection/${id}`);
    },
    [router],
  );

  return (
    <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
      <ScreenHeader
        title="Collections"
        onBack={() => {
          router.back();
        }}
        trailing={
          <Button
            variant="ghost"
            size="sm"
            accessibilityLabel="Create collection"
            onPress={openCreate}
          >
            Create
          </Button>
        }
      />

      {list.status === 'loading' ? <CollectionSkeleton /> : null}
      {list.status === 'error' ? (
        <CollectionErrorState
          isOffline={!isOnline}
          onRetry={() => {
            void list.refetch();
          }}
        />
      ) : null}
      {list.status === 'empty' ? <EmptyCollections onCreate={openCreate} /> : null}
      {list.status === 'ready' ? (
        <FlatList
          data={list.items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CollectionCard collection={item} onPress={openCollection} />}
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
