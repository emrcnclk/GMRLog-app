import { Screen, useTheme } from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';

import { mapAuthError } from '../../../src/auth/map-auth-error';
import { ScreenHeader } from '../../../src/navigation/screen-header';
import { useConnectivityStore } from '../../../src/state/stores';
import { ContentListSkeleton } from '../../content/components/content-list-skeleton';
import { BookmarkCard } from '../components/bookmark-card';
import { BookmarksErrorState } from '../components/bookmarks-error-state';
import { EmptyBookmarks } from '../components/empty-bookmarks';
import { useBookmarks } from '../hooks/use-bookmarks';

/** Private bookmarks — GET /bookmarks (D3.24). */
export function BookmarksScreen() {
  const theme = useTheme();
  const router = useRouter();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const list = useBookmarks();

  const openPost = useCallback(
    (postId: string) => {
      router.push(`/(app)/post/${postId}`);
    },
    [router],
  );

  const header = (
    <ScreenHeader
      title="Bookmarks"
      onBack={() => {
        router.back();
      }}
    />
  );

  return (
    <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
      {header}

      {list.status === 'loading' ? <ContentListSkeleton /> : null}

      {list.status === 'error' ? (
        <BookmarksErrorState
          title={mapAuthError(list.error, isOnline).title}
          description={mapAuthError(list.error, isOnline).description}
          onRetry={() => {
            void list.refetch();
          }}
        />
      ) : null}

      {list.status === 'empty' ? (
        <FlatList
          data={[]}
          renderItem={() => null}
          ListEmptyComponent={<EmptyBookmarks />}
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
          contentContainerStyle={{ flexGrow: 1 }}
        />
      ) : null}

      {list.status === 'ready' ? (
        <FlatList
          data={list.items}
          keyExtractor={(item) => item.bookmark.id}
          renderItem={({ item }) => <BookmarkCard row={item} onPressPost={openPost} />}
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
          onEndReached={() => {
            list.loadMore();
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            list.isFetchingNextPage ? (
              <View style={{ padding: theme.space('space.4'), alignItems: 'center' }}>
                <ContentListSkeleton rows={2} />
              </View>
            ) : null
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
