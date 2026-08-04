import type { NotificationResponse } from '@gmrlog/types';
import { Screen, ScreenTitle, useTheme } from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { RefreshControl, SectionList, View } from 'react-native';

import { mapAuthError } from '../../../src/auth/map-auth-error';
import { useConnectivityStore } from '../../../src/state/stores';
import { EmptyNotifications } from '../components/empty-notifications';
import { MarkAllReadButton } from '../components/mark-all-read-button';
import { NotificationCard } from '../components/notification-card';
import { NotificationErrorState } from '../components/notification-error-state';
import { NotificationSectionHeader } from '../components/notification-section-header';
import { NotificationSkeleton } from '../components/notification-skeleton';
import { groupNotificationsByDay, hrefForNotificationObject } from '../hooks/notification-model';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '../hooks/use-notifications';

/**
 * Notifications (`SCREEN_REDESIGNS.md` §12) — GET /notifications · POST /notifications/read.
 *
 * The title is `ScreenTitle`, not `NavHeader`: it belongs to the content and
 * scrolls away with it, the same rule 3.1 and 3.2 already established. §12's
 * grouping is "Today / This week / Earlier"; the app groups one bucket finer
 * (D3.28's "Yesterday", kept — the kicker pattern below is presentation only,
 * the bucketing itself is data shaping this task doesn't touch).
 *
 * The optimistic mark-read layer underneath is untouched: both mutations
 * already snapshot, write through, and roll back on failure via the offline
 * queue.
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

  const canMarkAll = list.status === 'ready' && list.unreadCount > 0;

  const header = (
    <ScreenTitle
      title="Notifications"
      meta={list.unreadCount > 0 ? `${String(list.unreadCount)} unread` : undefined}
      trailing={
        canMarkAll ? (
          <MarkAllReadButton
            unreadCount={list.unreadCount}
            loading={markAll.isPending}
            onPress={onMarkAll}
          />
        ) : undefined
      }
    />
  );

  return (
    <Screen edges={['top']} style={{ paddingBottom: 0 }}>
      {header}

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
