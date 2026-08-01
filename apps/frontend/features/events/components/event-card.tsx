import type { EventResponse } from '@gmrlog/types';
import { Badge, Text, pressableMotionStyle, useReduceMotion, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { eventKindLabel, formatEventStartsAt, isViewerGoing } from '../hooks/event-model';

export interface EventCardProps {
  event: EventResponse;
  onPress?: (eventId: string) => void;
}

function EventCardComponent({ event, onPress }: EventCardProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const when = formatEventStartsAt(event.startsAt);
  const kindLabel = eventKindLabel(event.kind);
  const going = isViewerGoing(event);

  const body = (
    <View
      style={{
        gap: theme.space('space.1'),
        paddingHorizontal: theme.space('space.4'),
        paddingVertical: theme.space('space.3'),
        borderBottomWidth: 1,
        borderBottomColor: theme.color('color.border.default'),
        backgroundColor: theme.color('color.background.primary'),
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.space('space.2'),
        }}
      >
        <Text role="label" color="color.text.primary" numberOfLines={2} style={{ flex: 1 }}>
          {event.title}
        </Text>
        {going ? <Badge tone="success">Going</Badge> : null}
      </View>
      <Text role="meta" color="color.text.secondary">
        {kindLabel} · {when}
      </Text>
    </View>
  );

  if (!onPress) {
    return (
      <View
        accessibilityRole="summary"
        accessibilityLabel={`${event.title}. ${kindLabel}. ${when}${going ? '. Going' : ''}`}
      >
        {body}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${event.title}. ${kindLabel}. ${when}${going ? '. Going' : ''}`}
      onPress={() => {
        onPress(event.id);
      }}
      style={({ pressed }) => pressableMotionStyle(pressed, reduceMotion)}
    >
      {body}
    </Pressable>
  );
}

export const EventCard = memo(EventCardComponent);
