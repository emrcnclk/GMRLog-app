import type { ActivityItemResponse } from '@gmrlog/types';
import { Avatar, Text, useTheme } from '@gmrlog/ui';
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

function ActivityCardComponent({ item }: ActivityCardProps) {
  const theme = useTheme();
  const actorName = item.actor?.displayName ?? 'Someone';
  const message = resolveActivityMessage(item);
  const timeLabel = formatActivityTime(item.createdAt);
  const TargetIcon = KIND_ICON[item.kind];

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={`${actorName} ${message}, ${timeLabel}`}
      style={{
        flexDirection: 'row',
        gap: theme.space('space.3'),
        paddingHorizontal: theme.space('space.4'),
        paddingVertical: theme.space('space.3'),
        borderBottomWidth: 1,
        borderBottomColor: theme.color('color.border.default'),
        backgroundColor: theme.color('color.background.primary'),
      }}
    >
      <Avatar
        size="md"
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
          <Text role="label" color="color.text.primary" numberOfLines={1} style={{ flex: 1 }}>
            {actorName}
          </Text>
          <Text role="meta" color="color.text.tertiary">
            {timeLabel}
          </Text>
        </View>
        <Text role="body" color="color.text.secondary">
          {message}
        </Text>
      </View>

      <View
        accessibilityLabel={`${item.kind} target`}
        style={{
          width: theme.space('space.10'),
          height: theme.space('space.10'),
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: theme.radius('radius.md'),
          backgroundColor: theme.color('color.surface.secondary'),
        }}
      >
        <TargetIcon size={20} color={theme.color('color.text.secondary')} strokeWidth={1.75} />
      </View>
    </View>
  );
}

export const ActivityCard = memo(ActivityCardComponent);
