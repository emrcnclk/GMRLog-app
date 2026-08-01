import type { FriendRequestResponse } from '@gmrlog/types';
import { Avatar, Button, Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { View } from 'react-native';

import { initialsFromDisplayName } from '../hooks/friends-model';

export interface FriendRequestCardProps {
  request: FriendRequestResponse;
  acceptPending?: boolean;
  rejectPending?: boolean;
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
}

function FriendRequestCardComponent({
  request,
  acceptPending = false,
  rejectPending = false,
  onAccept,
  onReject,
}: FriendRequestCardProps) {
  const theme = useTheme();
  const sender = request.sender;
  const busy = acceptPending || rejectPending;

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={`Friend request from ${sender.displayName}`}
      style={{
        paddingHorizontal: theme.space('space.4'),
        paddingVertical: theme.space('space.3'),
        borderBottomWidth: 1,
        borderBottomColor: theme.color('color.border.default'),
        gap: theme.space('space.3'),
        backgroundColor: theme.color('color.surface.secondary'),
      }}
    >
      <View style={{ flexDirection: 'row', gap: theme.space('space.3'), alignItems: 'center' }}>
        <Avatar
          size="md"
          uri={sender.avatarUrl ?? undefined}
          initials={initialsFromDisplayName(sender.displayName)}
          accessibilityLabel={`${sender.displayName} avatar`}
        />
        <View style={{ flex: 1, gap: theme.space('space.1') }}>
          <Text role="label" color="color.text.primary" numberOfLines={1}>
            {sender.displayName}
          </Text>
          <Text role="meta" color="color.text.secondary" numberOfLines={1}>
            @{sender.handle}
          </Text>
          {request.message ? (
            <Text role="body" color="color.text.secondary" numberOfLines={2}>
              {request.message}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: theme.space('space.2') }}>
        <View style={{ flex: 1 }}>
          <Button
            variant="primary"
            size="sm"
            disabled={busy}
            accessibilityLabel={`Accept friend request from ${sender.displayName}`}
            onPress={() => {
              onAccept(request.id);
            }}
          >
            Accept
          </Button>
        </View>
        <View style={{ flex: 1 }}>
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            accessibilityLabel={`Reject friend request from ${sender.displayName}`}
            onPress={() => {
              onReject(request.id);
            }}
          >
            Reject
          </Button>
        </View>
      </View>
    </View>
  );
}

export const FriendRequestCard = memo(FriendRequestCardComponent);
