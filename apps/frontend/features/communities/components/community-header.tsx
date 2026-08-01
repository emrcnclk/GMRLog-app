import type { CommunityResponse } from '@gmrlog/types';
import { Avatar, Text, useTheme } from '@gmrlog/ui';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { initialsFromName } from '../hooks/community-model';

import { JoinButton } from './join-button';

export interface CommunityHeaderProps {
  community: CommunityResponse;
  onBack: () => void;
  onError?: (message: string) => void;
}

export function CommunityHeader({ community, onBack, onError }: CommunityHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const hit = theme.space('space.12');

  return (
    <View style={{ backgroundColor: theme.color('color.background.primary') }}>
      <View
        accessibilityLabel="Banner placeholder"
        style={{
          height: theme.space('space.24'),
          backgroundColor: theme.color('color.surface.secondary'),
          justifyContent: 'flex-end',
          paddingTop: insets.top,
          paddingHorizontal: theme.space('space.4'),
          paddingBottom: theme.space('space.3'),
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={onBack}
          hitSlop={8}
          style={{ minHeight: hit, justifyContent: 'center', alignSelf: 'flex-start' }}
        >
          <Text role="label" color="color.interactive.primary">
            Back
          </Text>
        </Pressable>
      </View>

      <View
        style={{
          paddingHorizontal: theme.space('space.4'),
          paddingVertical: theme.space('space.4'),
          gap: theme.space('space.3'),
          borderBottomWidth: 1,
          borderBottomColor: theme.color('color.border.default'),
        }}
      >
        <View style={{ flexDirection: 'row', gap: theme.space('space.3'), alignItems: 'center' }}>
          <Avatar
            size="lg"
            uri={community.avatarUrl ?? undefined}
            initials={initialsFromName(community.name)}
            accessibilityLabel={`${community.name} avatar`}
          />
          <View style={{ flex: 1, gap: theme.space('space.1') }}>
            <Text role="heading" color="color.text.primary" numberOfLines={2}>
              {community.name}
            </Text>
            <Text role="meta" color="color.text.tertiary">
              {String(community.counts.members)} members
            </Text>
          </View>
        </View>
        <JoinButton community={community} onError={onError} />
      </View>
    </View>
  );
}
