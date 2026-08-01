import { Screen, useTheme } from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { useCallback, type ReactNode } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';

import { mapAuthError } from '../../../src/auth/map-auth-error';
import { ScreenHeader } from '../../../src/navigation/screen-header';
import { LIST_PERF } from '../../../src/performance/list-perf';
import { useConnectivityStore } from '../../../src/state/stores';
import { DiscoverRefreshContainer } from '../../discover/components/discover-refresh-container';
import { EmptyEvents } from '../components/empty-events';
import { EventCard } from '../components/event-card';
import { EventErrorState } from '../components/event-error-state';
import { EventListSkeleton } from '../components/event-skeleton';
import { useEvents } from '../hooks/use-events';

/** Events list — GET /discover/events. */
export function EventsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const list = useEvents();

  const openEvent = useCallback(
    (id: string) => {
      router.push(`/(app)/event/${id}`);
    },
    [router],
  );

  return (
    <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
      <ScreenHeader
        title="Events"
        titleRole="title"
        safeArea={false}
        onBack={() => {
          router.back();
        }}
      />

      {list.status === 'loading' ? <EventListSkeleton /> : null}

      {list.status === 'error' ? (
        <DiscoverRefreshContainer refreshing={list.isRefreshing} onRefresh={list.refresh}>
          <EventErrorState
            title={mapAuthError(list.error, isOnline).title}
            description={mapAuthError(list.error, isOnline).description}
            isOffline={!isOnline}
            onRetry={() => {
              void list.refetch();
            }}
          />
        </DiscoverRefreshContainer>
      ) : null}

      {list.status === 'empty' ? (
        <DiscoverRefreshContainer refreshing={list.isRefreshing} onRefresh={list.refresh}>
          <EmptyEventsChrome>
            <EmptyEvents />
          </EmptyEventsChrome>
        </DiscoverRefreshContainer>
      ) : null}

      {list.status === 'ready' ? (
        <FlatList
          data={list.items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <EventCard event={item} onPress={openEvent} />}
          onEndReached={() => {
            list.loadMore();
          }}
          onEndReachedThreshold={LIST_PERF.onEndReachedThreshold}
          windowSize={LIST_PERF.windowSize}
          maxToRenderPerBatch={LIST_PERF.maxToRenderPerBatch}
          initialNumToRender={LIST_PERF.initialNumToRender}
          updateCellsBatchingPeriod={LIST_PERF.updateCellsBatchingPeriod}
          removeClippedSubviews={LIST_PERF.removeClippedSubviews}
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
          ListFooterComponent={
            list.isFetchingNextPage ? (
              <View style={{ paddingVertical: theme.space('space.3') }}>
                <EventListSkeleton />
              </View>
            ) : (
              <View style={{ height: theme.space('space.6') }} />
            )
          }
          accessibilityRole="list"
        />
      ) : null}
    </Screen>
  );
}

function EmptyEventsChrome({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.space('space.6'),
        gap: theme.space('space.4'),
      }}
    >
      {children}
    </View>
  );
}
