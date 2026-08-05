import type { OnlineFriendResponse, PresenceStatusValue } from '@gmrlog/types';
import { Avatar, Rail, Text, useTheme, type SemanticColorToken } from '@gmrlog/ui';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { initialsFromDisplayName } from '../../friends/hooks/friends-model';

export interface PresenceRailProps {
  friends: OnlineFriendResponse[];
  onPressFriend: (userId: string) => void;
}

const STATUS_DOT_SIZE = 11;

function statusColor(status: PresenceStatusValue): SemanticColorToken {
  return status === 'online' ? 'color.status.success' : 'color.status.warning';
}

/**
 * §11's presence rail — 48px avatars, an 11px status dot ringed in the page
 * background (so it reads as a cutout, not a badge stuck on top), first name
 * beneath. Online friends first (`sortOnlineFriends`, applied by the hook).
 *
 * Not built into the shared `Avatar` primitive: the ring-and-dot treatment is
 * only asked for here, and `Avatar` has ~two dozen other call sites that don't
 * want it.
 */
function PresenceRailComponent({ friends, onPressFriend }: PresenceRailProps) {
  const theme = useTheme();

  if (friends.length === 0) {
    return null;
  }

  return (
    <Rail title="Online now" gap={theme.space('space.4')}>
      {friends.map(({ user, presence }) => (
        <Pressable
          key={user.id}
          accessibilityRole="button"
          accessibilityLabel={`${user.displayName}, ${presence.status}`}
          onPress={() => {
            onPressFriend(user.id);
          }}
          style={{
            alignItems: 'center',
            gap: theme.space('space.1'),
            width: theme.space('space.16'),
          }}
        >
          <View>
            <Avatar
              size="lg"
              uri={user.avatarUrl ?? undefined}
              initials={initialsFromDisplayName(user.displayName)}
              accessibilityLabel={`${user.displayName} avatar`}
            />
            <View
              style={{
                position: 'absolute',
                right: -1,
                bottom: -1,
                width: STATUS_DOT_SIZE,
                height: STATUS_DOT_SIZE,
                borderRadius: theme.radius('radius.full'),
                borderWidth: 2,
                borderColor: theme.color('color.background.primary'),
                backgroundColor: theme.color(statusColor(presence.status)),
              }}
            />
          </View>
          <Text role="label" color="color.text.secondary" numberOfLines={1}>
            {user.displayName.split(' ')[0]}
          </Text>
        </Pressable>
      ))}
    </Rail>
  );
}

export const PresenceRail = memo(PresenceRailComponent);
