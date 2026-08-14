import type { CommunityMemberResponse, DnaMatch } from '@gmrlog/types';
import { Avatar, Badge, Text, useTheme } from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { memo, useCallback } from 'react';
import { Pressable, View } from 'react-native';

import {
  DnaMatchToken,
  dnaMatchAccessibilityPhrase,
} from '../../dna-match/components/dna-match-token';
import { formatJoinedDate, initialsFromName, roleLabel } from '../hooks/community-model';

export interface CommunityMemberCardProps {
  member: CommunityMemberResponse;
  /**
   * Optional because `CommunityMemberResponse` carries no embedded score
   * yet — README.md's "State & data" section calls this out as a gap still
   * open. A future backend task can thread it through; until then this is
   * always absent and the token renders nothing.
   */
  match?: DnaMatch;
}

function CommunityMemberCardComponent({ member, match }: CommunityMemberCardProps) {
  const theme = useTheme();
  const router = useRouter();
  const { user, role, joinedAt } = member;

  // README §2c — tapping the row or avatar opens the Player screen.
  const openProfile = useCallback(() => {
    router.push(`/(app)/user/${user.id}`);
  }, [router, user.id]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${user.displayName}, @${user.handle}, ${roleLabel(role)}${
        match ? `. ${dnaMatchAccessibilityPhrase(match)}` : ''
      }`}
      onPress={openProfile}
      style={{
        flexDirection: 'row',
        gap: theme.space('space.3'),
        paddingHorizontal: theme.space('space.4'),
        paddingVertical: theme.space('space.3'),
        borderBottomWidth: 1,
        borderBottomColor: theme.color('color.border.default'),
        minHeight: theme.space('space.16'),
        backgroundColor: theme.color('color.background.primary'),
      }}
    >
      <Avatar
        size="md"
        uri={user.avatarUrl ?? undefined}
        initials={initialsFromName(user.displayName)}
        accessibilityLabel={`${user.displayName} avatar`}
      />
      <View style={{ flex: 1, gap: theme.space('space.1'), justifyContent: 'center' }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.space('space.2'),
          }}
        >
          <Text role="label" color="color.text.primary" numberOfLines={1} style={{ flex: 1 }}>
            {user.displayName}
          </Text>
          <Badge tone={role === 'owner' ? 'info' : 'neutral'}>{roleLabel(role)}</Badge>
        </View>
        <Text role="meta" color="color.text.secondary">
          @{user.handle}
          <DnaMatchToken match={match} variant="inline" />
        </Text>
        <Text role="caption" color="color.text.tertiary">
          Joined {formatJoinedDate(joinedAt)}
        </Text>
      </View>
    </Pressable>
  );
}

export const CommunityMemberCard = memo(CommunityMemberCardComponent);
