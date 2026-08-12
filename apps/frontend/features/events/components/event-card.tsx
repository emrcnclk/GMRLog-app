import type { EventResponse } from '@gmrlog/types';
import { Text, pressableMotionStyle, useReduceMotion, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import {
  eventDatePlateDay,
  eventDatePlateMonth,
  eventRowTime,
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
 * dot + "LIVE") beside title and a monospace time line.
 *
 * **Circle name and attendee count are not rendered.** §21's line reads
 * "time · attendees" and asks for the circle name beside the title, but
 * `EventResponse` (`packages/types`) carries neither — only `communityId`
 * (an FK, no denormalized name) and no attendee-count field anywhere in the
 * schema. Scores and counts are server-side per CLAUDE.md, so this line
 * shows the one real fact it has: `startsAt`. Backend follow-up, same shape
 * as 3.1's `holderPercent`: a denormalized `communityName` and an
 * `attendeeCount` on `EventResponse` would let this row match §21 in full.
 *
 * **The dot doesn't pulse.** `Animated.timing` driving `interpolate(transform)`
 * never advances on this app's web build (CLAUDE.md's platform traps); this
 * renders the dot at its settled, visible state on both platforms, same as
 * `ActiveNowRail`'s identical dot.
 */
function EventCardComponent({ event, onPress }: EventCardProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const live = isEventLive(event);
  const time = eventRowTime(event.startsAt);

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
          <Text role="metaSm" color="color.text.tertiary">
            {eventDatePlateMonth(event.startsAt)}
          </Text>
          <Text role="title3" color="color.text.primary">
            {eventDatePlateDay(event.startsAt)}
          </Text>
        </View>
      )}

      <View style={{ flex: 1, gap: theme.space('space.1'), justifyContent: 'center' }}>
        <Text role="label" color="color.text.primary" numberOfLines={2}>
          {event.title}
        </Text>
        <Text role="meta" color="color.text.tertiary">
          {time}
        </Text>
      </View>
    </View>
  );

  const label = `${event.title}${live ? '. Live now' : ''}. ${time}`;

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
