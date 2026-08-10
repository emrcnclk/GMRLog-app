import type { CommunityResponse } from '@gmrlog/types';
import { Rail, Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { CommunityEmblem } from './community-emblem';

export interface ActiveNowRailProps {
  /** Already filtered to `activeNow === true` — see `activeNowCommunities`. */
  communities: CommunityResponse[];
  onPress: (communityId: string) => void;
}

/** §13's own number — a card dimension, not a spacing token. */
const ACTIVE_NOW_CARD_WIDTH = 148;
const LIVE_DOT_SIZE = 11;

/**
 * `SCREEN_REDESIGNS_2.md` §13's second section — "Active now (bleeding rail of
 * 148px cards with a pulsing dot)". `Rail` supplies the bleed and the kicker;
 * this composes `CommunityEmblem` with the same corner-dot treatment 3.4's
 * `PresenceRail` already established for "a person/circle is live right now",
 * rather than inventing a second one.
 *
 * **Not animated.** A pulse is `opacity`/`scale` on a timer, and
 * `Animated.timing` driving `interpolate(transform)` has been measured never
 * advancing on this app's web build (`CLAUDE.md`'s platform traps, most
 * recently 3.2's `Toggle` knob) — colour-only re-renders survive, transforms
 * don't. Rather than ship a dot that pulses on native and freezes on web, the
 * dot renders at its settled, visible state on both platforms; the label
 * carries "active now" as a sentence, the same remedy every entry in that list
 * uses.
 */
function ActiveNowRailComponent({ communities, onPress }: ActiveNowRailProps) {
  const theme = useTheme();

  if (communities.length === 0) {
    return null;
  }

  return (
    <Rail title="Active now" counter={String(communities.length)}>
      {communities.map((community) => (
        <Pressable
          key={community.id}
          accessibilityRole="button"
          accessibilityLabel={`${community.name}, active now`}
          onPress={() => {
            onPress(community.id);
          }}
          style={{ width: ACTIVE_NOW_CARD_WIDTH, gap: theme.space('space.2') }}
        >
          <View>
            <CommunityEmblem name={community.name} avatarUrl={community.avatarUrl} size={40} />
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={{
                position: 'absolute',
                right: -1,
                bottom: -1,
                width: LIVE_DOT_SIZE,
                height: LIVE_DOT_SIZE,
                borderRadius: theme.radius('radius.full'),
                borderWidth: 2,
                borderColor: theme.color('color.background.primary'),
                backgroundColor: theme.color('color.status.success'),
              }}
            />
          </View>
          <Text role="label" color="color.text.primary" numberOfLines={1}>
            {community.name}
          </Text>
        </Pressable>
      ))}
    </Rail>
  );
}

export const ActiveNowRail = memo(ActiveNowRailComponent);
