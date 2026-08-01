import type { ObjectTypeValue } from '@gmrlog/types';
import { useTheme } from '@gmrlog/ui';
import {
  AlertTriangle,
  Calendar,
  Download,
  Folder,
  Gamepad2,
  Heart,
  ListOrdered,
  MessageCircle,
  MessageSquare,
  RefreshCw,
  Star,
  Trophy,
  User,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import { View } from 'react-native';

const OBJECT_ICON: Record<ObjectTypeValue, LucideIcon> = {
  game: Gamepad2,
  review: Star,
  post: MessageSquare,
  comment: MessageCircle,
  collection: Folder,
  tier_list: ListOrdered,
  user: User,
  community: Users,
  event: Calendar,
  achievement: Trophy,
};

/** Kinds with a dedicated icon; unknown kinds fall back to the object icon. */
export const NOTIFICATION_ICON_KINDS = [
  'friend_request',
  'friend_accepted',
  'achievement_unlocked',
  'comment',
  'reply',
  'like',
  'library_imported',
  'sync_completed',
  'sync_failed',
  'achievement_synced',
  'new_games_found',
  'library_updated',
] as const;

export type NotificationIconKind =
  (typeof NOTIFICATION_ICON_KINDS)[number] | (string & Record<never, never>);

export interface NotificationIconProps {
  objectType: ObjectTypeValue;
  /** Optional notification kind for more specific icons. */
  kind?: NotificationIconKind;
  accessibilityLabel?: string;
}

function iconForKind(kind: string | undefined, objectType: ObjectTypeValue): LucideIcon {
  switch (kind) {
    case 'friend_request':
      return UserPlus;
    case 'friend_accepted':
      return Users;
    case 'achievement_unlocked':
    case 'achievement_synced':
      return Trophy;
    case 'comment':
    case 'reply':
      return MessageCircle;
    case 'like':
      return Heart;
    case 'library_imported':
    case 'new_games_found':
    case 'library_updated':
      return Download;
    case 'sync_completed':
      return RefreshCw;
    case 'sync_failed':
      return AlertTriangle;
    default:
      return OBJECT_ICON[objectType];
  }
}

export function NotificationIcon({ objectType, kind, accessibilityLabel }: NotificationIconProps) {
  const theme = useTheme();
  const Icon = iconForKind(kind, objectType);
  const size = theme.space('space.10');

  return (
    <View
      accessibilityLabel={accessibilityLabel ?? `${objectType} object`}
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius('radius.md'),
        backgroundColor: theme.color('color.surface.secondary'),
      }}
    >
      <Icon size={20} color={theme.color('color.text.secondary')} strokeWidth={1.75} />
    </View>
  );
}
