import type { CommunityResponse } from '@gmrlog/types';
import { type BottomSheetAnchor, GradientScrim, HatchOverlay, Text, useTheme } from '@gmrlog/ui';
import { ChevronLeft, MoreHorizontal } from 'lucide-react-native';
import { useRef } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CachedImage } from '../../../src/assets/cached-image';
import { communityDetailMeta } from '../hooks/community-directory-model';

import {
  COMMUNITY_EMBLEM_OVERLAP_DETAIL,
  COMMUNITY_EMBLEM_SIZE_DETAIL,
  CommunityEmblem,
} from './community-emblem';
import { JoinButton } from './join-button';

/** §14's "168px full-bleed banner". Not on the space scale; a composition size. */
const COMMUNITY_BANNER_HEIGHT = 168;
/** CLAUDE.md's tap-target floor, which the glass buttons sit at. */
const GLASS_BUTTON_SIZE = 44;

export interface CommunityHeaderProps {
  community: CommunityResponse;
  onBack: () => void;
  onError?: (message: string) => void;
  /** Owner actions live behind §14's overflow control, opened at its own measured rect. */
  onOverflow?: (anchor: BottomSheetAnchor) => void;
}

/**
 * `SCREEN_REDESIGNS_2.md` §14 — the community detail shell's head.
 *
 * **Derived from §13's card, not invented beside it.** Same banner treatment
 * (artwork under a 5% diagonal hatch and a bottom scrim), the same squircle
 * emblem punching a background-coloured hole in the banner's edge, the same
 * accent-as-hairline reading of membership. Only the numbers change, and they
 * change the way §14 says: 168 instead of 96, and an emblem overlapping by 30
 * instead of 22 — still exactly half of itself, which is what keeps the plate
 * sitting *on* the edge.
 *
 * §14's "glass buttons" are the scrim's own surface plus a hairline, not a new
 * material: the banner already darkens under them, so a translucent fill over a
 * scrim is what glass means here. No shadow, no gradient — the design system
 * takes neither.
 */
export function CommunityHeader({ community, onBack, onError, onOverflow }: CommunityHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const overflowTriggerRef = useRef<View>(null);

  const openOverflow = () => {
    overflowTriggerRef.current?.measureInWindow((x, y, width, height) => {
      onOverflow?.({ x, y, width, height });
    });
  };

  /**
   * The glass buttons sit **on the scrim**, which is dark in both schemes by
   * design (`THEME_MIGRATION.md` §1–2, and the reason `scrim.foreground` is the
   * one token with the same value in light and dark). Their icons must take
   * that foreground, not `text.primary` — measured in light, `text.primary`
   * strokes `#16182A` on an `rgba(22,24,42,0.82)` fill, which is a dark glyph
   * on a dark plate and effectively invisible.
   */
  const glassForeground = theme.color('color.scrim.foreground');

  const glass = {
    width: GLASS_BUTTON_SIZE,
    height: GLASS_BUTTON_SIZE,
    borderRadius: theme.radius('radius.full'),
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: theme.color('color.scrim.strong'),
    borderWidth: 1,
    borderColor: theme.color('color.border.default'),
  };

  return (
    <View style={{ backgroundColor: theme.color('color.background.primary') }}>
      <View
        style={{
          height: COMMUNITY_BANNER_HEIGHT + insets.top,
          paddingTop: insets.top,
          backgroundColor: theme.color('color.surface.secondary'),
          overflow: 'hidden',
        }}
      >
        {community.bannerUrl === null ? null : (
          <CachedImage
            source={{ uri: community.bannerUrl }}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
            contentFit="cover"
            priority="high"
            accessibilityIgnoresInvertColors
          />
        )}
        <HatchOverlay opacity={0.05} />
        <GradientScrim direction="to-top" intensity={0.55} />

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: theme.space('space.4'),
            paddingTop: theme.space('space.3'),
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={onBack}
            style={glass}
          >
            <ChevronLeft size={20} color={glassForeground} strokeWidth={1.75} />
          </Pressable>

          {onOverflow === undefined ? null : (
            <Pressable
              ref={overflowTriggerRef}
              accessibilityRole="button"
              accessibilityLabel="Community actions"
              onPress={openOverflow}
              style={glass}
            >
              <MoreHorizontal size={20} color={glassForeground} strokeWidth={1.75} />
            </Pressable>
          )}
        </View>
      </View>

      <View
        style={{
          paddingHorizontal: theme.space('space.5'),
          paddingBottom: theme.space('space.4'),
          gap: theme.space('space.3'),
        }}
      >
        <View style={{ marginTop: -COMMUNITY_EMBLEM_OVERLAP_DETAIL }}>
          <CommunityEmblem
            name={community.name}
            avatarUrl={community.avatarUrl}
            size={COMMUNITY_EMBLEM_SIZE_DETAIL}
          />
        </View>

        <View style={{ gap: theme.space('space.1') }}>
          <Text role="title2" color="color.text.primary" numberOfLines={2}>
            {community.name}
          </Text>
          {/* §14 asks for "members · created · privacy". Only the first exists —
              see `communityDetailMeta`. */}
          <Text role="meta" color="color.text.tertiary">
            {communityDetailMeta(community)}
          </Text>
        </View>

        <JoinButton community={community} onError={onError} />
      </View>
    </View>
  );
}
