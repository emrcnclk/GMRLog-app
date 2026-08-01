import { Button, Screen, Text, useTheme } from '@gmrlog/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';

import { useAuthStore } from '../../../src/state/auth-store';
import { useConnectivityStore } from '../../../src/state/stores';
import { mapBoardError } from '../../boards/shared/board-model';
import { DeleteDialog } from '../../boards/shared/delete-dialog';
import { CollectionEntryCard } from '../components/collection-entry-card';
import { CollectionErrorState } from '../components/collection-error-state';
import { CollectionHeader } from '../components/collection-header';
import { CollectionDetailSkeleton } from '../components/collection-skeleton';
import { isCollectionOwner } from '../hooks/collection-model';
import { useCollection, useDeleteCollection } from '../hooks/use-collections';

export function CollectionDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const collectionId = typeof params.id === 'string' ? params.id : '';
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const userId = useAuthStore((s) => s.user?.id);
  const detail = useCollection(collectionId);
  const deleteMutation = useDeleteCollection();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [banner, setBanner] = useState<{ title: string; description: string } | null>(null);

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  if (detail.isPending && !detail.collection) {
    return (
      <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
        <CollectionDetailSkeleton />
      </Screen>
    );
  }

  if (detail.isError || !detail.collection) {
    const mapped = mapBoardError(detail.error, isOnline);
    return (
      <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
        <CollectionErrorState
          title={mapped.title}
          description={mapped.description}
          isOffline={!isOnline}
          onRetry={() => {
            void detail.refetch();
          }}
        />
      </Screen>
    );
  }

  const collection = detail.collection;
  const owner = isCollectionOwner(collection, userId);

  return (
    <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
      <FlatList
        data={collection.entries}
        keyExtractor={(item) => `${item.gameId}-${String(item.position)}`}
        windowSize={9}
        maxToRenderPerBatch={12}
        initialNumToRender={10}
        removeClippedSubviews
        ListHeaderComponent={
          <View style={{ gap: theme.space('space.4') }}>
            <CollectionHeader collection={collection} onBack={onBack} />
            {banner ? (
              <View style={{ paddingHorizontal: theme.space('space.4') }}>
                <Text role="body" color="color.text.secondary">
                  {banner.title}: {banner.description}
                </Text>
              </View>
            ) : null}
            {collection.description ? (
              <View
                style={{ paddingHorizontal: theme.space('space.4'), gap: theme.space('space.1') }}
              >
                <Text role="label" color="color.text.secondary">
                  Description
                </Text>
                <Text role="body" color="color.text.primary">
                  {collection.description}
                </Text>
              </View>
            ) : null}
            {owner ? (
              <View
                style={{
                  paddingHorizontal: theme.space('space.4'),
                  gap: theme.space('space.2'),
                }}
              >
                <Button
                  variant="secondary"
                  accessibilityLabel="Edit entries"
                  onPress={() => {
                    router.push(`/(app)/collection/${collection.id}/entries`);
                  }}
                >
                  Edit entries
                </Button>
                <Button
                  variant="secondary"
                  accessibilityLabel="Edit collection"
                  onPress={() => {
                    router.push(`/(app)/collection/${collection.id}/edit`);
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  accessibilityLabel="Delete collection"
                  onPress={() => {
                    setDeleteOpen(true);
                  }}
                >
                  Delete
                </Button>
              </View>
            ) : null}
            <Text
              role="label"
              color="color.text.secondary"
              style={{ paddingHorizontal: theme.space('space.4') }}
            >
              Entries
            </Text>
          </View>
        }
        renderItem={({ item }) => <CollectionEntryCard entry={item} />}
        ListEmptyComponent={
          <View style={{ padding: theme.space('space.6') }}>
            <Text role="body" color="color.text.tertiary">
              No games in this collection yet.
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={detail.isRefreshing}
            onRefresh={() => {
              void detail.refresh();
            }}
            tintColor={theme.color('color.interactive.primary')}
            colors={[theme.color('color.interactive.primary')]}
          />
        }
        contentContainerStyle={{ paddingBottom: theme.space('space.10') }}
      />

      <DeleteDialog
        visible={deleteOpen}
        title="Delete collection?"
        description="This removes the collection. This cannot be undone from the app."
        loading={deleteMutation.isPending}
        onCancel={() => {
          setDeleteOpen(false);
        }}
        onConfirm={() => {
          deleteMutation.mutate(collection.id, {
            onSuccess: () => {
              setDeleteOpen(false);
              router.replace('/(app)/collections');
            },
            onError: (error) => {
              setDeleteOpen(false);
              setBanner(mapBoardError(error, isOnline));
            },
          });
        }}
      />
    </Screen>
  );
}
