import type { EventResponse } from '@gmrlog/types';
import { Text, useTheme } from '@gmrlog/ui';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { eventKindLabel, formatEventWindow } from '../hooks/event-model';

import { RsvpPanel } from './rsvp-panel';

export interface EventHeaderProps {
  event: EventResponse;
  onBack: () => void;
  onError?: (message: string) => void;
}

export function EventHeader({ event, onBack, onError }: EventHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const hit = theme.space('space.12');
  const kindLabel = eventKindLabel(event.kind);
  const when = formatEventWindow(event.startsAt, event.endsAt);

  return (
    <View style={{ backgroundColor: theme.color('color.background.primary') }}>
      <View
        style={{
          paddingTop: insets.top,
          paddingHorizontal: theme.space('space.4'),
          paddingBottom: theme.space('space.3'),
          minHeight: theme.space('space.16'),
          justifyContent: 'flex-end',
          backgroundColor: theme.color('color.surface.secondary'),
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={onBack}
          hitSlop={8}
          style={{ minHeight: hit, justifyContent: 'center', alignSelf: 'flex-start' }}
        >
          <Text role="label" color="color.interactive.primary">
            Back
          </Text>
        </Pressable>
      </View>

      <View
        style={{
          paddingHorizontal: theme.space('space.4'),
          paddingVertical: theme.space('space.4'),
          gap: theme.space('space.3'),
          borderBottomWidth: 1,
          borderBottomColor: theme.color('color.border.default'),
        }}
      >
        <View style={{ gap: theme.space('space.1') }}>
          <Text role="heading" color="color.text.primary" numberOfLines={3}>
            {event.title}
          </Text>
          <Text role="meta" color="color.text.tertiary">
            {kindLabel} · {when}
          </Text>
        </View>
        <RsvpPanel event={event} onError={onError} />
      </View>
    </View>
  );
}
