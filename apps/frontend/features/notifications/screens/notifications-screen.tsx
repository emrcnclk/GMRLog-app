import type { NotificationResponse } from '@gmrlog/types';
import { Screen, useTheme } from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { RefreshControl, SectionList, View } from 'react-native';

import { mapAuthError } from '../../../src/auth/map-auth-error';
import { useConnectivityStore } from '../../../src/state/stores';
import { EmptyNotifications } from '../components/empty-notifications';
import { NotificationCard } from '../components/notification-card';
import { NotificationErrorState } from '../components/notification-error-state';
import { NotificationHeader } from '../components/notification-header';
import { NotificationSectionHeader } from '../components/notification-section-header';
import { NotificationSkeleton } from '../components/notification-skeleton';
import { groupNotificationsByDay, hrefForNotificationObject } from '../hooks/notification-model';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '../hooks/use-notifications';

/**
 * Notifications — GET /notifications · POST /notifications/read.
 *
 * D3.28 groups the flat list into Today / Yesterday / This week / Earlier. The
 * optimistic mark-read layer underneath is untouched: both mutations already
 * snapshot, write through, and roll back on failure via the offline queue.
 */
export function NotificationsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const list = useNotifications();
  const markOne = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const onMarkAll = useCallback(() => {
    markAll.mutate();
  }, [markAll]);

  const onPressNotification = useCallback(
    (notification: NotificationResponse) => {
      if (notification.readAt === null) {
        markOne.mutate(notification.id);
      }
      const href = hrefForNotificationObject(notification.objectRef);
      if (href) {
        router.push(href);
      }
    },
    [markOne, router],
  );

  const sections = useMemo(() => groupNotificationsByDay(list.items), [list.items]);

  const renderItem = useCallback(
    ({ item }: { item: NotificationResponse }) => (
      <NotificationCard notification={item} onPress={onPressNotification} />
    ),
    [onPressNotification],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: { title: string } }) => (
      <NotificationSectionHeader title={section.title} />
    ),
    [],
  );

  const keyExtractor = useCallback((item: NotificationResponse) => item.id, []);

  const refreshControl = (
    <RefreshControl
      refreshing={list.isRefreshing}
      onRefresh={() => {
        void list.refresh();
      }}
      tintColor={theme.color('color.interactive.primary')}
      colors={[theme.color('color.interactive.primary')]}
    />
  );

  return (
    <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
      <NotificationHeader
        unreadCount={list.unreadCount}
        markAllPending={markAll.isPending}
        onMarkAllRead={list.status === 'ready' ? onMarkAll : undefined}
      />

      {list.status === 'loading' ? <NotificationSkeleton /> : null}

      {list.status === 'error' ? (
        <NotificationErrorState
          title={mapAuthError(list.error, isOnline).title}
          description={mapAuthError(list.error, isOnline).description}
          isOffline={!isOnline}
          onRetry={() => {
            void list.refetch();
          }}
        />
      ) : null}

      {list.status === 'empty' ? (
        <SectionList
          sections={[]}
          renderItem={() => null}
          keyExtractor={keyExtractor}
          ListEmptyComponent={<EmptyNotifications />}
          refreshControl={refreshControl}
          contentContainerStyle={{ flexGrow: 1 }}
        />
      ) : null}

      {list.status === 'ready' ? (
        <SectionList
          sections={sections}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled
          onEndReached={list.loadMore}
          onEndReachedThreshold={0.4}
          refreshControl={refreshControl}
          ListFooterComponent={
            list.isFetchingNextPage ? (
              <View style={{ paddingVertical: theme.space('space.3') }}>
                <NotificationSkeleton rows={2} />
              </View>
            ) : (
              <View style={{ height: theme.space('space.6') }} />
            )
          }
          contentContainerStyle={{ flexGrow: 1, paddingBottom: theme.space('space.4') }}
          accessibilityRole="list"
          accessibilityLabel="Notifications"
          initialNumToRender={12}
          windowSize={9}
          maxToRenderPerBatch={12}
          removeClippedSubviews
        />
      ) : null}
    </Screen>
  );
}
