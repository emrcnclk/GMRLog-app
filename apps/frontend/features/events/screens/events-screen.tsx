import { Chip, SCREEN_GUTTER, Screen, ScreenTitle, SectionKicker, useTheme } from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { FlatList, RefreshControl, ScrollView, View } from 'react-native';

import { mapAuthError } from '../../../src/auth/map-auth-error';
import { LIST_PERF } from '../../../src/performance/list-perf';
import { useConnectivityStore } from '../../../src/state/stores';
import { DiscoverRefreshContainer } from '../../discover/components/discover-refresh-container';
import { EmptyEvents } from '../components/empty-events';
import { EventCard } from '../components/event-card';
import { EventErrorState } from '../components/event-error-state';
import { EventListSkeleton } from '../components/event-skeleton';
import {
  EVENT_FILTERS,
  filterEventsByKind,
  groupEventsByWhen,
  type EventFilterValue,
} from '../hooks/event-model';
import { useEvents } from '../hooks/use-events';

/**
 * §21 — the global Events hub (`GET /discover/events`). Filter pills and the
 * This week/Later split are real, computed from each event's own `kind` and
 * `startsAt`; the row itself (`EventCard`) flags what §21 asks for that the
 * API doesn't carry (circle name, attendee count, sponsorship).
 *
 * Filter pills only cover pages already fetched — `/discover/events` takes no
 * `kind` query param — recorded on `EVENT_FILTERS` in `event-model.ts`.
 */
export function EventsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const list = useEvents();
  const [filter, setFilter] = useState<EventFilterValue>('all');

  const openEvent = useCallback(
    (id: string) => {
      router.push(`/(app)/event/${id}`);
    },
    [router],
  );

  const filtered = useMemo(() => filterEventsByKind(list.items, filter), [list.items, filter]);
  const grouped = useMemo(() => groupEventsByWhen(filtered), [filtered]);

  const rows = useMemo(() => {
    const out: (
      | { kind: 'kicker'; key: string; title: string }
      | { kind: 'event'; key: string; eventId: string }
    )[] = [];
    if (grouped.thisWeek.length > 0) {
      out.push({ kind: 'kicker', key: 'kicker-this-week', title: 'This week' });
      for (const event of grouped.thisWeek) {
        out.push({ kind: 'event', key: event.id, eventId: event.id });
      }
    }
    if (grouped.later.length > 0) {
      out.push({ kind: 'kicker', key: 'kicker-later', title: 'Later' });
      for (const event of grouped.later) {
        out.push({ kind: 'event', key: event.id, eventId: event.id });
      }
    }
    return out;
  }, [grouped]);

  const byId = useMemo(() => new Map(filtered.map((event) => [event.id, event])), [filtered]);

  const filterPills = (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', gap: theme.space('space.2') }}>
        {EVENT_FILTERS.map((f) => (
          <Chip
            key={f.value}
            selected={filter === f.value}
            accessibilityLabel={`Filter: ${f.label}`}
            onPress={() => {
              setFilter(f.value);
            }}
          >
            {f.label}
          </Chip>
        ))}
      </View>
    </ScrollView>
  );

  const title = (
    <ScreenTitle
      style={{ paddingHorizontal: 0 }}
      title="Events"
      backLabel="Circles"
      onPressBack={() => {
        router.back();
      }}
    />
  );

  const gutteredTitle = (
    <View style={{ paddingHorizontal: theme.space(SCREEN_GUTTER), gap: theme.space('space.3') }}>
      {title}
      {filterPills}
    </View>
  );

  return (
    <Screen edges={[]}>
      {list.status === 'loading' ? (
        <>
          {gutteredTitle}
          <EventListSkeleton />
        </>
      ) : null}

      {list.status === 'error' ? (
        <>
          {gutteredTitle}
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
        </>
      ) : null}

      {list.status === 'empty' ? (
        <>
          {gutteredTitle}
          <DiscoverRefreshContainer refreshing={list.isRefreshing} onRefresh={list.refresh}>
            <EmptyEventsChrome>
              <EmptyEvents />
            </EmptyEventsChrome>
          </DiscoverRefreshContainer>
        </>
      ) : null}

      {list.status === 'ready' ? (
        <FlatList
          data={rows}
          keyExtractor={(row) => row.key}
          renderItem={({ item }) => {
            if (item.kind === 'kicker') {
              return (
                <View
                  style={{
                    paddingTop: theme.space('space.4'),
                    paddingBottom: theme.space('space.2'),
                  }}
                >
                  <SectionKicker title={item.title} />
                </View>
              );
            }
            const event = byId.get(item.eventId);
            if (!event) {
              return null;
            }
            return <EventCard event={event} onPress={openEvent} />;
          }}
          ListHeaderComponent={
            <View style={{ gap: theme.space('space.3') }}>
              {title}
              {filterPills}
            </View>
          }
          onEndReached={() => {
            list.loadMore();
          }}
          onEndReachedThreshold={LIST_PERF.onEndReachedThreshold}
          windowSize={LIST_PERF.windowSize}
          maxToRenderPerBatch={LIST_PERF.maxToRenderPerBatch}
          initialNumToRender={LIST_PERF.initialNumToRender}
          updateCellsBatchingPeriod={LIST_PERF.updateCellsBatchingPeriod}
          removeClippedSubviews={LIST_PERF.removeClippedSubviews}
          contentContainerStyle={{
            paddingHorizontal: theme.space(SCREEN_GUTTER),
            paddingBottom: theme.space('space.8'),
          }}
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
