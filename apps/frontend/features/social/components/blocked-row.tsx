import type { UserPublicResponse } from '@gmrlog/types';
import { Avatar, Button, Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { View } from 'react-native';

import { initialsFromName } from '../hooks/social-model';

/** §15's row avatar — the tap-target floor, not a step on the space scale. */
const ROW_AVATAR_SIZE = 44;

/** §15's Blocked row: "rows at opacity 0.42 reading 'Unblock'." */
const BLOCKED_ROW_OPACITY = 0.42;

export interface BlockedRowProps {
  user: UserPublicResponse;
  unblockPending: boolean;
  onUnblock: (userId: string) => void;
}

function BlockedRowComponent({ user, unblockPending, onUnblock }: BlockedRowProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space('space.2'),
        paddingHorizontal: theme.space('space.4'),
        paddingVertical: theme.space('space.3'),
        borderBottomWidth: 1,
        borderBottomColor: theme.color('color.border.default'),
        opacity: BLOCKED_ROW_OPACITY,
      }}
    >
      <View
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: theme.space('space.3') }}
      >
        <Avatar
          sizeOverride={ROW_AVATAR_SIZE}
          uri={user.avatarUrl ?? undefined}
          initials={initialsFromName(user.displayName)}
          accessibilityLabel={`${user.displayName} avatar`}
        />
        <View style={{ flex: 1, gap: theme.space('space.1') }}>
          <Text role="label" color="color.text.primary" numberOfLines={1}>
            {user.displayName}
          </Text>
          <Text role="meta" color="color.text.secondary" numberOfLines={1}>
            @{user.handle}
          </Text>
        </View>
      </View>

      <Button
        variant="ghost"
        size="sm"
        loading={unblockPending}
        accessibilityLabel={`Unblock ${user.displayName}`}
        onPress={() => {
          onUnblock(user.id);
        }}
      >
        Unblock
      </Button>
    </View>
  );
}

export const BlockedRow = memo(BlockedRowComponent);
