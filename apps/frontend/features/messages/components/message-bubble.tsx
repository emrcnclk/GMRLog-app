import type { MessageResponse, UserPublicResponse } from '@gmrlog/types';
import { Avatar, Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { View } from 'react-native';

import {
  formatMessageTime,
  initialsFromName,
  type MessageBubbleModel,
} from '../hooks/messaging-model';

export interface MessageBubbleProps {
  bubble: MessageBubbleModel;
  sender?: UserPublicResponse;
}

function MessageBubbleComponent({ bubble, sender }: MessageBubbleProps) {
  const theme = useTheme();
  const { message, isMine, showAvatar, showTimestamp, isOptimistic } = bubble;
  const name = sender?.displayName ?? 'Player';

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`${isMine ? 'You' : name}: ${message.body}`}
      style={{
        flexDirection: 'row',
        justifyContent: isMine ? 'flex-end' : 'flex-start',
        gap: theme.space('space.2'),
        paddingHorizontal: theme.space('space.4'),
        paddingVertical: theme.space('space.1'),
        opacity: isOptimistic ? 0.7 : 1,
      }}
    >
      {!isMine ? (
        <View style={{ width: theme.space('space.10'), alignItems: 'center' }}>
          {showAvatar ? (
            <Avatar
              size="sm"
              uri={sender?.avatarUrl ?? undefined}
              initials={initialsFromName(name)}
              accessibilityLabel={`${name} avatar`}
            />
          ) : null}
        </View>
      ) : null}

      <View
        style={{
          maxWidth: '78%',
          gap: theme.space('space.1'),
          alignItems: isMine ? 'flex-end' : 'flex-start',
        }}
      >
        {showAvatar && !isMine ? (
          <Text role="caption" color="color.text.tertiary">
            {name}
          </Text>
        ) : null}
        <View
          style={{
            paddingHorizontal: theme.space('space.3'),
            paddingVertical: theme.space('space.2'),
            borderRadius: theme.radius('radius.lg'),
            backgroundColor: isMine
              ? theme.color('color.interactive.primary')
              : theme.color('color.surface.secondary'),
          }}
        >
          <Text role="body" color={isMine ? 'color.text.inverse' : 'color.text.primary'}>
            {message.body}
          </Text>
        </View>
        {showTimestamp ? (
          <Text role="caption" color="color.text.tertiary">
            {formatMessageTime(message.createdAt)}
            {isOptimistic ? ' · Sending' : ''}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export const MessageBubble = memo(MessageBubbleComponent);

export type { MessageResponse };
