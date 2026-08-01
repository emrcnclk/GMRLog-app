import { ErrorBanner, Screen, Text, useTheme } from '@gmrlog/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

import { mapAuthError } from '../../../src/auth/map-auth-error';
import { useConnectivityStore } from '../../../src/state/stores';
import { EventErrorState } from '../components/event-error-state';
import { EventHeader } from '../components/event-header';
import { EventDetailSkeleton } from '../components/event-skeleton';
import { eventKindLabel, formatEventWindow } from '../hooks/event-model';
import { useEvent } from '../hooks/use-events';

/** Event detail — GET /events/{id}. */
export function EventDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const eventId = typeof params.id === 'string' ? params.id : '';
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const detail = useEvent(eventId);
  const [banner, setBanner] = useState<{ title: string; description: string } | null>(null);

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  const onParticipationError = useCallback(
    (message: string) => {
      const mapped = mapAuthError(new Error(message), isOnline);
      setBanner({ title: mapped.title, description: mapped.description });
    },
    [isOnline],
  );

  if (detail.isPending && !detail.event) {
    return (
      <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
        <EventDetailSkeleton />
      </Screen>
    );
  }

  if (detail.isError && !detail.event) {
    const mapped = mapAuthError(detail.error, isOnline);
    return (
      <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
        <EventErrorState
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

  if (!detail.event) {
    return (
      <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
        <EventErrorState
          title="Event not found"
          description="This event may have been removed."
          onRetry={onBack}
        />
      </Screen>
    );
  }

  const event = detail.event;

  return (
    <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
      <ScrollView
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
        contentContainerStyle={{
          paddingBottom: theme.space('space.10'),
          gap: theme.space('space.4'),
        }}
      >
        <EventHeader event={event} onBack={onBack} onError={onParticipationError} />

        {banner ? (
          <View style={{ paddingHorizontal: theme.space('space.4') }}>
            <ErrorBanner title={banner.title} description={banner.description} />
          </View>
        ) : null}

        <View
          style={{
            paddingHorizontal: theme.space('space.4'),
            gap: theme.space('space.3'),
          }}
        >
          <View style={{ gap: theme.space('space.1') }}>
            <Text role="label" color="color.text.secondary">
              Schedule
            </Text>
            <Text role="body" color="color.text.primary">
              {formatEventWindow(event.startsAt, event.endsAt)}
            </Text>
          </View>

          <View style={{ gap: theme.space('space.1') }}>
            <Text role="label" color="color.text.secondary">
              Kind
            </Text>
            <Text role="body" color="color.text.primary">
              {eventKindLabel(event.kind)}
            </Text>
          </View>

          {event.gameId ? (
            <View style={{ gap: theme.space('space.1') }}>
              <Text role="label" color="color.text.secondary">
                Linked game
              </Text>
              <Text role="meta" color="color.text.tertiary">
                {event.gameId}
              </Text>
            </View>
          ) : null}

          {event.communityId ? (
            <View style={{ gap: theme.space('space.1') }}>
              <Text role="label" color="color.text.secondary">
                Linked community
              </Text>
              <Text role="meta" color="color.text.tertiary">
                {event.communityId}
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}
