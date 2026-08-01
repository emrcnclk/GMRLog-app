import type { ConversationResponse } from '@gmrlog/types';
import { Avatar, Badge, Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import {
  conversationPeers,
  conversationTitle,
  formatRelativeActivity,
  initialsFromName,
} from '../hooks/messaging-model';

export interface ConversationCardProps {
  conversation: ConversationResponse;
  selfId: string | null | undefined;
  onPress: (conversationId: string) => void;
}

function ConversationCardComponent({ conversation, selfId, onPress }: ConversationCardProps) {
  const theme = useTheme();
  const title = conversationTitle(conversation, selfId);
  const peers = conversationPeers(conversation, selfId);
  const primary = peers[0];
  const preview = conversation.lastMessage?.body.trim() ?? 'No messages yet';
  const activityIso = conversation.lastMessage?.createdAt ?? conversation.updatedAt;
  const unread = conversation.unreadCount;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${preview}. ${formatRelativeActivity(activityIso)}`}
      onPress={() => {
        onPress(conversation.id);
      }}
      style={{
        flexDirection: 'row',
        gap: theme.space('space.3'),
        paddingHorizontal: theme.space('space.4'),
        paddingVertical: theme.space('space.3'),
        minHeight: theme.space('space.16'),
        borderBottomWidth: 1,
        borderBottomColor: theme.color('color.border.default'),
        backgroundColor: theme.color('color.background.primary'),
      }}
    >
      <Avatar
        size="md"
        uri={primary?.avatarUrl ?? undefined}
        initials={initialsFromName(title)}
        accessibilityLabel={`${title} avatar`}
      />

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
            {title}
          </Text>
          <Text role="meta" color="color.text.tertiary">
            {formatRelativeActivity(activityIso)}
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.space('space.2'),
          }}
        >
          <Text role="body" color="color.text.secondary" numberOfLines={1} style={{ flex: 1 }}>
            {preview}
          </Text>
          {unread > 0 ? <Badge tone="info">{String(unread)}</Badge> : null}
        </View>
      </View>
    </Pressable>
  );
}

export const ConversationCard = memo(ConversationCardComponent);
