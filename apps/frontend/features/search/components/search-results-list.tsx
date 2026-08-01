import type { SearchHit } from '@gmrlog/types';
import { useTheme } from '@gmrlog/ui';
import { useCallback } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';

import { searchHitKey } from '../hooks/search-model';

import { SearchResultCard } from './search-result-card';
import { SearchResultSkeleton } from './search-skeleton';

export interface SearchResultsListProps {
  items: SearchHit[];
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
  onEndReached: () => void;
  isFetchingNextPage: boolean;
  onPressHit: (hit: SearchHit) => void;
}

export function SearchResultsList({
  items,
  refreshing,
  onRefresh,
  onEndReached,
  isFetchingNextPage,
  onPressHit,
}: SearchResultsListProps) {
  const theme = useTheme();

  const renderItem = useCallback(
    ({ item }: { item: SearchHit }) => (
      <SearchResultCard
        hit={item}
        onPress={() => {
          onPressHit(item);
        }}
      />
    ),
    [onPressHit],
  );

  const keyExtractor = useCallback((item: SearchHit) => searchHitKey(item), []);

  return (
    <FlatList
      data={items}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            void onRefresh();
          }}
          tintColor={theme.color('color.interactive.primary')}
          colors={[theme.color('color.interactive.primary')]}
        />
      }
      ListFooterComponent={
        isFetchingNextPage ? (
          <View style={{ paddingVertical: theme.space('space.3') }}>
            <SearchResultSkeleton />
          </View>
        ) : (
          <View style={{ height: theme.space('space.6') }} />
        )
      }
      accessibilityRole="list"
      accessibilityLabel="Search results"
      // A tap must land on the row, not be swallowed dismissing the keyboard.
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      removeClippedSubviews
      windowSize={9}
      maxToRenderPerBatch={12}
      initialNumToRender={10}
    />
  );
}
