import type { ReactElement, ReactNode } from 'react';
import { FlatList, RefreshControl, View, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/theme-provider';

export interface EntityListProps<T> {
  items: readonly T[];
  keyExtractor: (item: T) => string;
  renderItem: (item: T, index: number) => ReactElement | null;

  /** Pull-to-refresh. Both are required together or the control is omitted. */
  refreshing?: boolean;
  onRefresh?: () => void;

  /** Cursor pagination. */
  onEndReached?: () => void;
  isFetchingNextPage?: boolean;
  /**
   * Rendered under the list while the next page is in flight. Pass the same
   * skeleton the list uses on first load so growth reads as continuation rather
   * than as a new loading state.
   */
  footerSkeleton?: ReactNode;

  header?: ReactElement | null;
  empty?: ReactElement | null;

  /** Grid mode. Leave at 1 for a plain vertical list. */
  numColumns?: number;
  columnGap?: number;

  contentContainerStyle?: ViewStyle;
  /** Fixed row height, when known — lets the list skip measurement. */
  itemHeight?: number;
  accessibilityLabel?: string;
  testID?: string;
}

/**
 * Tuned for artwork rows on mid-range Android: render a screen and a bit, keep
 * roughly four screens of neighbours mounted, and detach the rest. These were
 * copy-pasted identically across every list in the app before D3.28; they live
 * here now so a change lands everywhere at once.
 */
const WINDOW_SIZE = 9;
const INITIAL_NUM_TO_RENDER = 10;
const MAX_TO_RENDER_PER_BATCH = 12;
const END_REACHED_THRESHOLD = 0.4;

/**
 * The one virtualized list. Every paginated, refreshable collection surface —
 * games, communities, events, collections, notifications, search results —
 * renders through this, so their scroll physics, refresh tint, pagination
 * threshold, footer treatment, and list semantics cannot drift apart.
 *
 * It deliberately does not know what it is listing: pass `renderItem` and the
 * feature keeps ownership of its card.
 */
export function EntityList<T>({
  items,
  keyExtractor,
  renderItem,
  refreshing,
  onRefresh,
  onEndReached,
  isFetchingNextPage = false,
  footerSkeleton,
  header,
  empty,
  numColumns = 1,
  columnGap,
  contentContainerStyle,
  itemHeight,
  accessibilityLabel,
  testID,
}: EntityListProps<T>) {
  const theme = useTheme();
  const tint = theme.color('color.interactive.primary');
  const gap = columnGap ?? theme.space('space.3');

  return (
    <FlatList
      data={items}
      keyExtractor={keyExtractor}
      renderItem={({ item, index }) => renderItem(item, index)}
      numColumns={numColumns > 1 ? numColumns : undefined}
      columnWrapperStyle={
        numColumns > 1 ? { gap, paddingHorizontal: theme.space('space.4') } : undefined
      }
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      ListFooterComponent={
        isFetchingNextPage && footerSkeleton !== undefined ? (
          <View style={{ paddingVertical: theme.space('space.3') }}>{footerSkeleton}</View>
        ) : (
          <View style={{ height: theme.space('space.6') }} />
        )
      }
      refreshControl={
        onRefresh !== undefined ? (
          <RefreshControl
            refreshing={refreshing ?? false}
            onRefresh={onRefresh}
            tintColor={tint}
            colors={[tint]}
          />
        ) : undefined
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={END_REACHED_THRESHOLD}
      getItemLayout={
        itemHeight !== undefined
          ? (_data, index) => ({ length: itemHeight, offset: itemHeight * index, index })
          : undefined
      }
      contentContainerStyle={[{ flexGrow: 1 }, contentContainerStyle]}
      accessibilityRole="list"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      removeClippedSubviews
      windowSize={WINDOW_SIZE}
      initialNumToRender={INITIAL_NUM_TO_RENDER}
      maxToRenderPerBatch={MAX_TO_RENDER_PER_BATCH}
    />
  );
}
