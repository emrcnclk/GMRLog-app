import type { ActivityItemResponse } from '@gmrlog/types';
import { Avatar, SCREEN_GUTTER, Text, useTheme } from '@gmrlog/ui';
import {
  Bookmark,
  Calendar,
  Clock,
  Download,
  Folder,
  Gamepad2,
  Heart,
  Link,
  ListOrdered,
  MessageCircle,
  MessageSquare,
  Pin,
  RefreshCw,
  Star,
  Trophy,
  Unlink,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import { memo } from 'react';
import { View } from 'react-native';

import { formatActivityTime, resolveActivityMessage } from '../hooks/activity-feed-model';

export interface ActivityCardProps {
  item: ActivityItemResponse;
}

const KIND_ICON: Record<ActivityItemResponse['kind'], LucideIcon> = {
  review: Star,
  post: MessageSquare,
  collection: Folder,
  game_log: Gamepad2,
  tier_list: ListOrdered,
  friend: UserPlus,
  recommendation_slot: Bookmark,
  community: Users,
  event: Calendar,
  achievement: Trophy,
  library_import: Download,
  like: Heart,
  comment: MessageCircle,
  wishlist: Bookmark,
  profile_pin: Pin,
  milestone: Trophy,
  library_synced: RefreshCw,
  achievement_synced: Trophy,
  playtime_updated: Clock,
  integration_connected: Link,
  integration_disconnected: Unlink,
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return (parts[0] ?? '?').slice(0, 2);
  }
  return `${(parts[0] ?? '').slice(0, 1)}${(parts[1] ?? '').slice(0, 1)}`;
}

/**
 * Attribution row only (`SCREEN_REDESIGNS.md` §4's "post" shape has three parts:
 * attribution row, game block, body copy + action row). The feed API's
 * `FeedItemResponse.projection` is always `null` — no embedded game cover/title/
 * platform/hours, no body text, no like/comment/share counts exist anywhere in
 * this response, only `actor`, `kind` and a `{ type, id }` object reference. The
 * client must not invent them (CLAUDE.md: scores and counts are server-owned).
 * Built: avatar, name, handle, a verb line derived from the real `kind`, and a
 * monospace timestamp — everything the feed API actually returns. The kind
 * glyph keeps §12 Notifications' established "32px outlined circle" treatment
 * (a real prior redesign decision for the identical `ActivityKindValue` concept)
 * in place of the game block this row has no data to draw.
 */
function ActivityCardComponent({ item }: ActivityCardProps) {
  const theme = useTheme();
  const actorName = item.actor?.displayName ?? 'Someone';
  const message = resolveActivityMessage(item);
  const timeLabel = formatActivityTime(item.createdAt);
  const TargetIcon = KIND_ICON[item.kind];

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={`${actorName}${item.actor ? ` @${item.actor.handle}` : ''}, ${message}, ${timeLabel}`}
      style={{
        flexDirection: 'row',
        gap: theme.space('space.3'),
        paddingHorizontal: theme.space(SCREEN_GUTTER),
        paddingVertical: theme.space('space.4'),
        borderBottomWidth: 1,
        borderBottomColor: theme.color('color.border.default'),
        backgroundColor: theme.color('color.background.primary'),
      }}
    >
      <Avatar
        size="sm"
        uri={item.actor?.avatarUrl ?? undefined}
        initials={initialsFromName(actorName)}
        accessibilityLabel={`${actorName} avatar`}
      />

      <View style={{ flex: 1, gap: theme.space('space.1') }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: theme.space('space.2'),
          }}
        >
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'baseline',
              gap: theme.space('space.1'),
            }}
          >
            <Text role="label" color="color.text.primary" numberOfLines={1}>
              {actorName}
            </Text>
            {item.actor ? (
              <Text role="meta" color="color.text.tertiary" numberOfLines={1}>
                @{item.actor.handle}
              </Text>
            ) : null}
          </View>
          <Text role="meta" color="color.text.tertiary">
            {timeLabel}
          </Text>
        </View>
        <Text role="bodySm" color="color.text.secondary">
          {message}
        </Text>
      </View>

      <View
        accessibilityLabel={`${item.kind} target`}
        style={{
          width: theme.space('space.8'),
          height: theme.space('space.8'),
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: theme.radius('radius.full'),
          borderWidth: 1,
          borderColor: theme.color('color.text.secondary'),
        }}
      >
        <TargetIcon size={16} color={theme.color('color.text.secondary')} strokeWidth={1.75} />
      </View>
    </View>
  );
}

export const ActivityCard = memo(ActivityCardComponent);
