import type { EventResponse } from '@gmrlog/types';
import { Text, pressableMotionStyle, usePulseOpacity, useReduceMotion, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import {
  eventDatePlateDay,
  eventDatePlateMonth,
  eventRowMeta,
  isEventLive,
} from '../hooks/event-model';

export interface EventCardProps {
  event: EventResponse;
  onPress?: (eventId: string) => void;
}

const PLATE_SIZE = 46;
const LIVE_DOT_SIZE = 7;

/**
 * §21's event row. A left date plate (or, for a live event, a pulsing accent
 * dot + "LIVE") beside title, circle name and a monospace "time · attendees"
 * line. `communityName`/`attendeeCount` are 9.4's additive fields — both are
 * server-derived (CLAUDE.md's "scores are server-side"), so the client only
 * renders what the response carries; a response without a community shows no
 * circle-name slot at all, and a response from before 9.4 shipped shows time
 * alone via `eventRowMeta`'s own fallback.
 *
 * **The dot pulses, off `opacity` and a plain re-render.** CLAUDE.md's trap is
 * specific — `Animated.timing` driving `interpolate(transform)` never advances
 * on this build, while plain re-renders still do. `usePulseOpacity` drives
 * `opacity` from `setState` on an interval and touches no part of `Animated`,
 * so it advances identically on native and web. Reduce-motion holds it at its
 * settled, visible state. (`ActiveNowRail`'s dot still renders frozen; it can
 * adopt this hook, but retrofitting it is not this task's change.)
 */
function EventCardComponent({ event, onPress }: EventCardProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const live = isEventLive(event);
  const meta = eventRowMeta(event);
  const pulse = usePulseOpacity(live, reduceMotion);

  const body = (
    <View
      style={{
        flexDirection: 'row',
        gap: theme.space('space.4'),
        paddingVertical: theme.space('space.3'),
        borderBottomWidth: 1,
        borderBottomColor: theme.color('color.border.default'),
      }}
    >
      {live ? (
        <View
          style={{
            width: PLATE_SIZE,
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.space('space.1'),
          }}
        >
          <View
            style={{
              width: LIVE_DOT_SIZE,
              height: LIVE_DOT_SIZE,
              borderRadius: theme.radius('radius.full'),
              backgroundColor: theme.color('color.accent.default'),
              opacity: pulse,
            }}
          />
          <Text role="metaSm" color="color.accent.default">
            LIVE
          </Text>
        </View>
      ) : (
        <View
          style={{
            width: PLATE_SIZE,
            height: PLATE_SIZE,
            borderRadius: theme.radius('radius.md'),
            borderWidth: 1,
            borderColor: theme.color('color.border.default'),
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.space('space.1'),
          }}
        >
          <Text role="title3" color="color.text.primary">
            {eventDatePlateDay(event.startsAt)}
          </Text>
          <Text role="metaSm" color="color.text.tertiary">
            {eventDatePlateMonth(event.startsAt)}
          </Text>
        </View>
      )}

      <View style={{ flex: 1, gap: theme.space('space.1'), justifyContent: 'center' }}>
        <Text role="label" color="color.text.primary" numberOfLines={2}>
          {event.title}
        </Text>
        {event.communityName != null ? (
          <Text role="bodySm" color="color.text.secondary" numberOfLines={1}>
            {event.communityName}
          </Text>
        ) : null}
        <Text role="meta" color="color.text.tertiary">
          {meta}
        </Text>
      </View>
    </View>
  );

  const label = `${event.title}${live ? '. Live now' : ''}. ${meta}`;

  if (!onPress) {
    return (
      <View accessibilityRole="summary" accessibilityLabel={label}>
        {body}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
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
