import type { NotificationResponse } from '@gmrlog/types';
import { Avatar, Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import {
  formatNotificationTime,
  initialsFromDisplayName,
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
      accessibilityLabel={`${unread ? 'Unread. ' : ''}${actorName}. ${message}. ${timeLabel}`}
      onPress={() => {
        onPress(notification);
      }}
      style={{
        flexDirection: 'row',
        gap: theme.space('space.3'),
        paddingHorizontal: theme.space('space.4'),
        paddingVertical: theme.space('space.3'),
        minHeight: hit,
        borderBottomWidth: 1,
        borderBottomColor: theme.color('color.border.default'),
        backgroundColor: unread
          ? theme.color('color.surface.secondary')
          : theme.color('color.background.primary'),
      }}
    >
      <View style={{ position: 'relative' }}>
        <Avatar
          size="md"
          uri={notification.actor?.avatarUrl ?? undefined}
          initials={initialsFromDisplayName(actorName)}
          accessibilityLabel={`${actorName} avatar placeholder`}
        />
        {unread ? (
          <View
            accessibilityLabel="Unread indicator"
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: theme.space('space.2'),
              height: theme.space('space.2'),
              borderRadius: theme.radius('radius.full'),
              backgroundColor: theme.color('color.interactive.primary'),
            }}
          />
        ) : null}
      </View>

      <View style={{ flex: 1, gap: theme.space('space.1'), justifyContent: 'center' }}>
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
        <Text role="body" color="color.text.secondary" numberOfLines={3}>
          {message}
        </Text>
      </View>

      <NotificationIcon
        objectType={notification.objectRef.type}
        kind={notification.messageKey || notification.kind}
      />
    </Pressable>
  );
}

export const NotificationCard = memo(NotificationCardComponent);
