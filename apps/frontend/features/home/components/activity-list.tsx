import type { ActivityItemResponse } from '@gmrlog/types';
import { Text, useTheme } from '@gmrlog/ui';
import { useCallback } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';

import { ActivityCard } from './activity-card';
import { ActivitySkeleton } from './feed-skeleton';

export interface ActivityListProps {
  items: ActivityItemResponse[];
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
  onEndReached: () => void;
  isFetchingNextPage: boolean;
}

/**
 * Cursor-paginated activity list — FlatList · stable keys · memoized rows.
 */
export function ActivityList({
  items,
  refreshing,
  onRefresh,
  onEndReached,
  isFetchingNextPage,
}: ActivityListProps) {
  const theme = useTheme();

  const renderItem = useCallback(
    ({ item }: { item: ActivityItemResponse }) => <ActivityCard item={item} />,
    [],
  );

  const keyExtractor = useCallback((item: ActivityItemResponse) => item.id, []);

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
            <ActivitySkeleton />
          </View>
        ) : (
          <View style={{ height: theme.space('space.6') }} />
        )
      }
      ListEmptyComponent={
        <Text role="body" color="color.text.secondary" style={{ textAlign: 'center' }}>
          No activity yet
        </Text>
      }
      accessibilityRole="list"
      removeClippedSubviews
      windowSize={9}
      maxToRenderPerBatch={12}
      initialNumToRender={10}
    />
  );
}
