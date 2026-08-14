import type { DnaMatch, FriendshipResponse } from '@gmrlog/types';
import { Avatar, Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import {
  DnaMatchToken,
  dnaMatchAccessibilityPhrase,
} from '../../dna-match/components/dna-match-token';
import { formatFriendsSince, initialsFromDisplayName } from '../hooks/friends-model';

export interface FriendCardProps {
  friendship: FriendshipResponse;
  onPress: (userId: string) => void;
  /**
   * Optional because `FriendshipResponse` carries no match data yet — none
   * of the friends hooks fetch it. A future backend task can thread it
   * through; until then this is always absent and the token renders nothing,
   * per README.md §1's "no match means unavailable" rule.
   */
  match?: DnaMatch;
}

function FriendCardComponent({ friendship, onPress, match }: FriendCardProps) {
  const theme = useTheme();
  const user = friendship.user;
  const since = formatFriendsSince(friendship.friendsSince);
  const mutual =
    friendship.mutualFriendsCount > 0 ? `${String(friendship.mutualFriendsCount)} mutual` : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${user.displayName}. ${since}${
        match ? `. ${dnaMatchAccessibilityPhrase(match)}` : ''
      }`}
      onPress={() => {
        onPress(user.id);
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
        uri={user.avatarUrl ?? undefined}
        initials={initialsFromDisplayName(user.displayName)}
        accessibilityLabel={`${user.displayName} avatar`}
      />
      <View style={{ flex: 1, gap: theme.space('space.1'), justifyContent: 'center' }}>
        <Text role="label" color="color.text.primary" numberOfLines={1}>
          {user.displayName}
        </Text>
        <Text role="meta" color="color.text.secondary" numberOfLines={1}>
          @{user.handle}
          {since ? ` · ${since}` : ''}
          {mutual ? ` · ${mutual}` : ''}
        </Text>
        <DnaMatchToken match={match} />
      </View>
    </Pressable>
  );
}

export const FriendCard = memo(FriendCardComponent);
