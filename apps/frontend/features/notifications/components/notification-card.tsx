import type { NotificationResponse } from '@gmrlog/types';
import { SCREEN_GUTTER, Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import {
  formatNotificationTime,
  isNotificationUnread,
  resolveNotificationMessage,
} from '../hooks/notification-model';

import { NotificationIcon } from './notification-icon';

export interface NotificationCardProps {
  notification: NotificationResponse;
  onPress: (notification: NotificationResponse) => void;
}

function NotificationCardComponent({ notification, onPress }: NotificationCardProps) {
  const theme = useTheme();
  const unread = isNotificationUnread(notification);
  const actorName = notification.actor?.displayName ?? 'Someone';
  const message = resolveNotificationMessage(notification);
  const timeLabel = formatNotificationTime(notification.createdAt);
  const hit = theme.space('space.12');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: unread }}
      aria-selected={unread}
      accessibilityLabel={`${unread ? 'Unread. ' : ''}${actorName}. ${message}. ${timeLabel}`}
      onPress={() => {
        onPress(notification);
      }}
      style={{
        flexDirection: 'row',
        gap: theme.space('space.3'),
        paddingHorizontal: theme.space(SCREEN_GUTTER),
        paddingVertical: theme.space('space.3'),
        minHeight: hit,
        borderBottomWidth: 1,
        borderBottomColor: theme.color('color.border.default'),
        backgroundColor: unread
          ? theme.color('color.surface.secondary')
          : theme.color('color.background.primary'),
      }}
    >
      <NotificationIcon
        objectType={notification.objectRef.type}
        kind={notification.messageKey || notification.kind}
      />

      <View style={{ flex: 1, gap: theme.space('space.1'), justifyContent: 'center' }}>
        <Text role="body" color="color.text.secondary" numberOfLines={3}>
          <Text role="body" color="color.text.primary" style={{ fontWeight: '500' }}>
            {actorName}
          </Text>
          {` ${message}`}
        </Text>
        <Text role="meta" color="color.text.tertiary">
          {timeLabel}
        </Text>
      </View>

      {unread ? (
        <View
          accessibilityLabel="Unread indicator"
          style={{
            width: theme.space('space.1'),
            height: theme.space('space.1'),
            borderRadius: theme.radius('radius.full'),
            backgroundColor: theme.color('color.accent.default'),
            marginTop: theme.space('space.1'),
          }}
        />
      ) : null}
    </Pressable>
  );
}

export const NotificationCard = memo(NotificationCardComponent);
