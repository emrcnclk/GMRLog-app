import { Avatar, Skeleton, Text, useTheme, type SemanticColorToken } from '@gmrlog/ui';
import {
  Folder,
  Gamepad2,
  Heart,
  MessageCircle,
  MessageSquare,
  Sparkles,
  Star,
  Trophy,
  UserPlus,
  type LucideIcon,
} from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { userInitials } from '../user/initials';

import type { TimelineCardModel, TimelineCardTone } from './timeline-model';

const TONE_ICON: Record<TimelineCardTone, LucideIcon> = {
  review: Star,
  rating: Star,
  finished: Gamepad2,
  achievement: Trophy,
  collection: Folder,
  follow: UserPlus,
  comment: MessageCircle,
  like: Heart,
  post: MessageSquare,
  system: Sparkles,
};

/**
 * Icon tint per tone. Rarity/status colours carry the meaning; the card surface
 * itself stays neutral so a dense feed never turns into a colour riot.
 */
const TONE_COLOR: Record<TimelineCardTone, SemanticColorToken> = {
  review: 'color.rarity.legendary',
  rating: 'color.rarity.legendary',
  finished: 'color.status.success',
  achievement: 'color.rarity.epic',
  collection: 'color.status.info',
  follow: 'color.accent.default',
  comment: 'color.text.secondary',
  like: 'color.status.error',
  post: 'color.text.secondary',
  system: 'color.text.tertiary',
};

export interface TimelineCardProps {
  model: TimelineCardModel;
  /** Extra line under the message — review excerpt, game title, achievement name. */
  detail?: string;
  /** Omit to render a non-interactive card (nothing to open). */
  onPress?: () => void;
  onPressActor?: (userId: string) => void;
}

/**
 * D3.27 Phase 7 — the social timeline card.
 *
 * One component behind every feed row (review · rating · finished · achievement ·
 * collection · follow · comment · like · post), so Home, Profile and Game Hub
 * cannot drift apart. Press feedback lives on the whole row; the actor's name is
 * a separate target so tapping a name goes to the profile, not the object.
 */
function TimelineCardComponent({ model, detail, onPress, onPressActor }: TimelineCardProps) {
  const theme = useTheme();
  const Icon = TONE_ICON[model.tone];
  const iconColor = theme.color(TONE_COLOR[model.tone]);
  const actorName = model.actor?.displayName ?? 'Someone';

  const body = (
    <View
      style={{
        flexDirection: 'row',
        gap: theme.space('space.3'),
        paddingHorizontal: theme.space('space.4'),
        paddingVertical: theme.space('space.3'),
      }}
    >
      <View>
        <Avatar
          size="md"
          initials={userInitials(actorName)}
          uri={model.actor?.avatarUrl ?? undefined}
          accessibilityLabel={`${actorName} avatar`}
        />
        <View
          style={{
            position: 'absolute',
            right: -2,
            bottom: -2,
            width: theme.space('space.5'),
            height: theme.space('space.5'),
            borderRadius: theme.radius('radius.full'),
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.color('color.background.primary'),
            borderWidth: 1,
            borderColor: theme.color('color.border.default'),
          }}
        >
          <Icon size={12} color={iconColor} />
        </View>
      </View>

      <View style={{ flex: 1, gap: theme.space('space.1') }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'baseline',
            gap: theme.space('space.2'),
            flexWrap: 'wrap',
          }}
        >
          {model.actor !== null && onPressActor !== undefined ? (
            <Text
              role="label"
              onPress={() => {
                onPressActor(model.actor?.id ?? '');
              }}
              accessibilityRole="link"
              accessibilityLabel={`Open ${actorName}'s profile`}
            >
              {actorName}
            </Text>
          ) : (
            <Text role="label">{actorName}</Text>
          )}
          <Text role="body" color="color.text.secondary" style={{ flexShrink: 1 }}>
            {model.message}
          </Text>
        </View>

        {detail !== undefined && detail.length > 0 ? (
          <Text role="body" color="color.text.secondary" numberOfLines={3}>
            {detail}
          </Text>
        ) : null}

        {model.timeLabel !== '' ? (
          <Text role="meta" color="color.text.tertiary">
            {model.timeLabel}
          </Text>
        ) : null}
      </View>
    </View>
  );

  const frame = {
    borderBottomWidth: 1,
    borderBottomColor: theme.color('color.border.default'),
  } as const;

  if (onPress === undefined) {
    return <View style={frame}>{body}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={model.accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [frame, { opacity: pressed ? 0.85 : 1 }]}
    >
      {body}
    </Pressable>
  );
}

/** Matching bone for the card above — same rhythm, so the swap does not jump. */
export function TimelineCardSkeleton() {
  const theme = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: theme.space('space.3'),
        paddingHorizontal: theme.space('space.4'),
        paddingVertical: theme.space('space.3'),
        borderBottomWidth: 1,
        borderBottomColor: theme.color('color.border.default'),
      }}
    >
      <Skeleton shape="circle" height={theme.space('space.10')} />
      <View style={{ flex: 1, gap: theme.space('space.2') }}>
        <Skeleton shape="line" width="55%" />
        <Skeleton shape="line" width="80%" />
        <Skeleton shape="line" width="25%" />
      </View>
    </View>
  );
}

export const TimelineCard = memo(TimelineCardComponent);
