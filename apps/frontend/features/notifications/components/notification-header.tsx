import { ScreenHeader } from '../../../src/navigation/screen-header';

import { MarkAllReadButton } from './mark-all-read-button';

export interface NotificationHeaderProps {
  unreadCount: number;
  markAllPending?: boolean;
  onMarkAllRead?: () => void;
}

export function NotificationHeader({
  unreadCount,
  markAllPending = false,
  onMarkAllRead,
}: NotificationHeaderProps) {
  const canMarkAll = onMarkAllRead !== undefined && unreadCount > 0;

  return (
    <ScreenHeader
      title="Notifications"
      subtitle={unreadCount > 0 ? `${String(unreadCount)} unread` : undefined}
      trailing={
        canMarkAll ? (
          <MarkAllReadButton
            unreadCount={unreadCount}
            loading={markAllPending}
            onPress={onMarkAllRead}
          />
        ) : undefined
      }
    />
  );
}
