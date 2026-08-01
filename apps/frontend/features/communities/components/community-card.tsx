import type { CommunityResponse } from '@gmrlog/types';
import { Avatar, Badge, Text, pressableMotionStyle, useReduceMotion, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { CachedImage } from '../../../src/assets/cached-image';
import { initialsFromName, isCommunityMember } from '../hooks/community-model';

export interface CommunityCardProps {
  community: CommunityResponse;
  onPress: (communityId: string) => void;
}

function CommunityCardComponent({ community, onPress }: CommunityCardProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const membersLabel = `${String(community.counts.members)} members`;
  const joined = isCommunityMember(community);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${community.name}. ${membersLabel}${joined ? '. Joined' : ''}`}
      onPress={() => {
        onPress(community.id);
      }}
      style={({ pressed }) => [
        {
          gap: theme.space('space.3'),
          paddingHorizontal: theme.space('space.4'),
          paddingVertical: theme.space('space.3'),
          borderBottomWidth: 1,
          borderBottomColor: theme.color('color.border.default'),
          backgroundColor: theme.color('color.background.primary'),
          minHeight: theme.space('space.16'),
        },
        pressableMotionStyle(pressed, reduceMotion),
      ]}
    >
      <View
        accessibilityLabel={community.bannerUrl ? 'Community banner' : 'Banner placeholder'}
        style={{
          height: theme.space('space.16'),
          borderRadius: theme.radius('radius.md'),
          backgroundColor: theme.color('color.surface.secondary'),
          overflow: 'hidden',
          justifyContent: 'flex-end',
          padding: theme.space('space.3'),
        }}
      >
        {community.bannerUrl ? (
          <CachedImage
            source={{ uri: community.bannerUrl }}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
            }}
            contentFit="cover"
            priority="low"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <Text role="caption" color="color.text.tertiary">
            Banner
          </Text>
        )}
      </View>

      <View style={{ flexDirection: 'row', gap: theme.space('space.3') }}>
        <Avatar
          size="lg"
          uri={community.avatarUrl ?? undefined}
          initials={initialsFromName(community.name)}
          accessibilityLabel={`${community.name} avatar`}
          priority="high"
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
              {community.name}
            </Text>
            {joined ? <Badge tone="success">Joined</Badge> : null}
          </View>
          {community.description ? (
            <Text role="body" color="color.text.secondary" numberOfLines={2}>
              {community.description}
            </Text>
          ) : null}
          <Text role="meta" color="color.text.tertiary">
            {membersLabel}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export const CommunityCard = memo(CommunityCardComponent);
