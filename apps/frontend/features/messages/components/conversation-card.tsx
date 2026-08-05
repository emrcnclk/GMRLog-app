import type { ConversationResponse } from '@gmrlog/types';
import { Avatar, SCREEN_GUTTER, Text, useTheme } from '@gmrlog/ui';
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

/**
 * §11's unread count: "a small pill with an accent hairline" — a line, not a
 * fill, per the design law. `Badge` always fills its tone, and ~30 other
 * screens depend on that, so this stays a local treatment rather than a new
 * `Badge` variant.
 */
function UnreadCountPill({ count }: { count: number }) {
  const theme = useTheme();
  return (
    <View
      accessibilityLabel={`${String(count)} unread`}
      style={{
        minWidth: theme.space('space.4'),
        paddingHorizontal: theme.space('space.1'),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius('radius.full'),
        borderWidth: 1,
        borderColor: theme.color('color.accent.default'),
      }}
    >
      <Text role="metaSm" color="color.accent.default">
        {String(count)}
      </Text>
    </View>
  );
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
        paddingHorizontal: theme.space(SCREEN_GUTTER),
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
          <Text
            role="body"
            color={unread > 0 ? 'color.text.primary' : 'color.text.tertiary'}
            numberOfLines={1}
            style={{ flex: 1 }}
          >
            {preview}
          </Text>
          {unread > 0 ? <UnreadCountPill count={unread} /> : null}
        </View>
      </View>
    </Pressable>
  );
}

export const ConversationCard = memo(ConversationCardComponent);
