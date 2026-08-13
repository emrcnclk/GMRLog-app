import type { EventResponse } from '@gmrlog/types';
import { HatchOverlay, Text, usePulseOpacity, useReduceMotion, useTheme } from '@gmrlog/ui';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { eventKindLabel, isEventLive } from '../hooks/event-model';

export interface TournamentHeaderProps {
  event: EventResponse;
  onBack: () => void;
}

/** §22's "186px full-bleed" hero, not on the space scale — a composition size. */
const TOURNAMENT_HERO_HEIGHT = 186;
/** CLAUDE.md's tap-target floor, which the glass back button sits at. */
const GLASS_BUTTON_SIZE = 44;
const LIVE_DOT_SIZE = 7;

/**
 * `SCREEN_REDESIGNS_2.md` §22 — the Tournament screen's hero header.
 *
 * **No gradient fill.** §22 asks for a "full-bleed gradient header"; this
 * design system takes no gradient dependency (`GradientScrim`'s own doc,
 * `THEME_MIGRATION.md` §5), and `pro-card.tsx` (§9) already recorded the
 * substitution for exactly this situation: surface lightness plus an
 * `color.accent.muted` ring stands in for the gradient. Here that's
 * `color.background.elevated` fill with the ring as the header's own bottom
 * edge, rather than reintroducing a gradient for one screen. Hatch stays —
 * it's a texture, not a gradient, and needs no artwork underneath it.
 *
 * **No banner artwork.** `EventResponse` carries no image field, so unlike
 * `CommunityHeader`/`GameHero` there is nothing for a legibility scrim to
 * darken. The glass back button still sits on `color.scrim.strong`, which is
 * dark in both schemes by design — its own plate supplies the contrast the
 * scrim would otherwise have provided.
 *
 * **The kicker never fabricates a round.** §22 asks for "LIVE ·
 * QUARTER-FINALS"; nothing in `EventResponse` carries a round or stage, only
 * `startsAt`/`endsAt`. Live derives from `isEventLive` (the same real-window
 * check §21's row uses) and reads "LIVE" alone; when not live, the kicker
 * falls back to the event's real `kind` instead of a placeholder. Flagged as
 * a backend gap the way §21's circle name/attendee count were: a per-match
 * round/stage field would let this kicker match §22 in full.
 */
export function TournamentHeader({ event, onBack }: TournamentHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const live = isEventLive(event);
  const pulse = usePulseOpacity(live, reduceMotion);

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
    <View
      style={{
        height: TOURNAMENT_HERO_HEIGHT + insets.top,
        paddingTop: insets.top,
        backgroundColor: theme.color('color.background.elevated'),
        borderBottomWidth: 1,
        borderBottomColor: theme.color('color.accent.muted'),
        overflow: 'hidden',
        justifyContent: 'space-between',
      }}
    >
      <HatchOverlay opacity={0.045} />

      <View
        style={{
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
      </View>

      <View
        style={{
          paddingHorizontal: theme.space('space.4'),
          paddingBottom: theme.space('space.4'),
          gap: theme.space('space.2'),
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space('space.2') }}>
          {live ? (
            <View
              style={{
                width: LIVE_DOT_SIZE,
                height: LIVE_DOT_SIZE,
                borderRadius: theme.radius('radius.full'),
                backgroundColor: theme.color('color.accent.default'),
                opacity: pulse,
              }}
            />
          ) : null}
          <Text role="metaSm" color={live ? 'color.accent.default' : 'color.text.tertiary'}>
            {live ? 'LIVE' : eventKindLabel(event.kind).toUpperCase()}
          </Text>
        </View>
        <Text role="title2" color="color.text.primary" numberOfLines={2}>
          {event.title}
        </Text>
      </View>
    </View>
  );
}
