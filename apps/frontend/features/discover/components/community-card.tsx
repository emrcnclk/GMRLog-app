import type { CommunityResponse } from '@gmrlog/types';
import { Avatar, Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

export interface CommunityCardProps {
  community: CommunityResponse;
  onPress?: (communityId: string) => void;
}

function CommunityCardComponent({ community, onPress }: CommunityCardProps) {
  const theme = useTheme();
  const membersLabel = `${String(community.counts.members)} members`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${community.name}. ${membersLabel}`}
      disabled={!onPress}
      onPress={() => {
        onPress?.(community.id);
      }}
      style={{
        flexDirection: 'row',
        gap: theme.space('space.3'),
        paddingHorizontal: theme.space('space.4'),
        paddingVertical: theme.space('space.3'),
        borderBottomWidth: 1,
        borderBottomColor: theme.color('color.border.default'),
        backgroundColor: theme.color('color.background.primary'),
        minHeight: theme.space('space.16'),
      }}
    >
      <Avatar
        size="lg"
        uri={community.avatarUrl ?? undefined}
        initials={community.name.slice(0, 2)}
        accessibilityLabel={`${community.name} avatar`}
      />
      <View style={{ flex: 1, gap: theme.space('space.1'), justifyContent: 'center' }}>
        <Text role="label" color="color.text.primary" numberOfLines={1}>
          {community.name}
        </Text>
        {community.description ? (
          <Text role="body" color="color.text.secondary" numberOfLines={2}>
            {community.description}
          </Text>
        ) : null}
        <Text role="meta" color="color.text.tertiary">
          {membersLabel}
        </Text>
      </View>
    </Pressable>
  );
}

export const CommunityCard = memo(CommunityCardComponent);
