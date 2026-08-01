import { Button, EntityList, Screen, useTheme } from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useWindowDimensions } from 'react-native';

import { ScreenHeader } from '../../../src/navigation/screen-header';
import { useConnectivityStore } from '../../../src/state/stores';
import { CollectionCard } from '../components/collection-card';
import { CollectionErrorState } from '../components/collection-error-state';
import { CollectionSkeleton } from '../components/collection-skeleton';
import { CollectionToolbar } from '../components/collection-toolbar';
import { EmptyCollections } from '../components/empty-collections';
import {
  sortCollections,
  type CollectionLayout,
  type CollectionSort,
} from '../hooks/collection-view-model';
import { useCollections } from '../hooks/use-collections';

const GRID_COLUMNS = 2;

export function CollectionsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const list = useCollections();

  const [sort, setSort] = useState<CollectionSort>('recent');
  const [layout, setLayout] = useState<CollectionLayout>('list');

  const openCreate = useCallback(() => {
    router.push('/(app)/collections/create');
  }, [router]);

  const openDiscover = useCallback(() => {
    router.push('/(app)/(tabs)/discover/collections');
  }, [router]);

  const openCollection = useCallback(
    (id: string) => {
      router.push(`/(app)/collection/${id}`);
    },
    [router],
  );

  const sorted = useMemo(() => sortCollections(list.items, sort), [list.items, sort]);

  // Derived from the live viewport so a rotated phone or a tablet re-flows
  // instead of stretching two tiles across the width.
  const gutter = theme.space('space.4');
  const gap = theme.space('space.3');
  const tileWidth = (width - gutter * 2 - gap * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

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

      {list.status === 'empty' ? (
        <EmptyCollections onCreate={openCreate} onDiscover={openDiscover} />
      ) : null}

      {list.status === 'ready' ? (
        <>
          <CollectionToolbar
            sort={sort}
            onChangeSort={setSort}
            layout={layout}
            onChangeLayout={setLayout}
          />
          <EntityList
            // Remount on layout change: a grid and a list have different item
            // heights, and reusing the recycler across them mismeasures scroll.
            key={layout}
            items={sorted}
            keyExtractor={(item) => item.id}
            renderItem={(item) => (
              <CollectionCard
                collection={item}
                onPress={openCollection}
                layout={layout}
                width={layout === 'grid' ? tileWidth : undefined}
              />
            )}
            numColumns={layout === 'grid' ? GRID_COLUMNS : 1}
            refreshing={list.isRefreshing}
            onRefresh={() => {
              void list.refresh();
            }}
            contentContainerStyle={
              layout === 'grid'
                ? {
                    paddingTop: theme.space('space.4'),
                    gap,
                    paddingBottom: theme.space('space.8'),
                  }
                : { paddingBottom: theme.space('space.8') }
            }
            accessibilityLabel="Your collections"
          />
        </>
      ) : null}
    </Screen>
  );
}
