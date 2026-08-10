import type { CommunityResponse } from '@gmrlog/types';
import {
  GradientScrim,
  HatchOverlay,
  Text,
  pressableMotionStyle,
  useReduceMotion,
  useTheme,
} from '@gmrlog/ui';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { CachedImage } from '../../../src/assets/cached-image';
import { communityFooterLine, communityFriendReason } from '../hooks/community-directory-model';
import { isCommunityMember } from '../hooks/community-model';

import { COMMUNITY_EMBLEM_OVERLAP, CommunityEmblem } from './community-emblem';

export interface CommunityCardProps {
  community: CommunityResponse;
  onPress: (communityId: string) => void;
}

/** §13's footer "live dot when active" — a glyph dimension, not a spacing token. */
const LIVE_DOT_SIZE = 6;

/**
 * `SCREEN_REDESIGNS_2.md` §13's circle card.
 *
 * "96px banner strip edge to edge across the card top, with a diagonal hatch at
 * 5% and a bottom scrim. Overlapping the banner by `-22px`: a 44px squircle
 * emblem… Name at 16px weight 500, one-line description in secondary, then a
 * monospace footer."
 *
 * **Joined reads as a hairline, not a badge.** §13 is explicit — "not a badge,
 * not a filled chip" — so the `Badge tone="success"` this card used to carry is
 * gone and membership is the card's own edge in `color.accent.muted` instead of
 * `color.border.default`. It stays in the accessibility label, where it is the
 * one thing a border cannot say.
 */
function CommunityCardComponent({ community, onPress }: CommunityCardProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const joined = isCommunityMember(community);
  const footer = communityFooterLine(community);
  const friendReason = communityFriendReason(community);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${community.name}. ${footer}${community.activeNow === true ? '. Active now' : ''}${friendReason === null ? '' : `. ${friendReason}`}${joined ? '. Joined' : ''}`}
      onPress={() => {
        onPress(community.id);
      }}
      style={({ pressed }) => [
        {
          borderRadius: theme.radius('radius.lg'),
          borderWidth: 1,
          // §13's one membership signal. The accent as an edge is the law's own
          // example of what it is for; it never fills the card behind content.
          borderColor: theme.color(joined ? 'color.accent.muted' : 'color.border.default'),
          backgroundColor: theme.color('color.background.primary'),
          overflow: 'hidden',
        },
        pressableMotionStyle(pressed, reduceMotion),
      ]}
    >
      {/* Edge to edge across the card top: no padding around it, and the card's
          own `overflow: hidden` clips it back to the corner radius. */}
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          height: theme.space('space.24'),
          backgroundColor: theme.color('color.surface.secondary'),
          overflow: 'hidden',
        }}
      >
        {community.bannerUrl === null ? null : (
          <CachedImage
            source={{ uri: community.bannerUrl }}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
            contentFit="cover"
            priority="low"
            accessibilityIgnoresInvertColors
          />
        )}
        {/* §13's "diagonal hatch at 5%" over the strip, banner or no banner —
            it is what keeps an empty strip from reading as a grey slab. */}
        <HatchOverlay opacity={0.05} />
        {/* The scrim is what the emblem sits against, so it stays even when
            there is no artwork to darken. */}
        <GradientScrim direction="to-top" intensity={0.55} />
      </View>

      <View
        style={{
          paddingHorizontal: theme.space('space.4'),
          paddingBottom: theme.space('space.4'),
          gap: theme.space('space.2'),
        }}
      >
        <View style={{ marginTop: -COMMUNITY_EMBLEM_OVERLAP }}>
          <CommunityEmblem name={community.name} avatarUrl={community.avatarUrl} />
        </View>

        {/* §13 asks for 16/500; the ramp's nearest step is `headline` (17/500) —
            the exact weight over the exact size, the same call §1's wordmark and
            3.1's row title made. The ramp has no 16. */}
        <Text role="headline" color="color.text.primary" numberOfLines={1}>
          {community.name}
        </Text>

        {community.description === null ? null : (
          <Text role="body" color="color.text.secondary" numberOfLines={1}>
            {community.description}
          </Text>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space('space.1') }}>
          <Text role="meta" color="color.text.tertiary">
            {footer}
          </Text>
          {/* §13's own third footer term: "a live dot when active". `activeNowCommunities`
              drives the separate rail above; this is the same signal on the card itself,
              per-circle rather than aggregate. Not animated — see `ActiveNowRail`'s own
              note on why a pulse is not attempted on this build. */}
          {community.activeNow === true ? (
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={{
                width: LIVE_DOT_SIZE,
                height: LIVE_DOT_SIZE,
                borderRadius: theme.radius('radius.full'),
                backgroundColor: theme.color('color.status.success'),
              }}
            />
          ) : null}
        </View>

        {/* §13: "each with a one-line reason in accent monospace". The accent
            as text is what the law permits it to be — a line, not a fill — and
            monospace is where CLAUDE.md puts every count. */}
        {friendReason === null ? null : (
          <Text role="meta" color="color.accent.default">
            {friendReason}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

export const CommunityCard = memo(CommunityCardComponent);
