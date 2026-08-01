import type { UserSelfResponse } from '@gmrlog/types';
import { Avatar, Button, Text, useTheme } from '@gmrlog/ui';
import { MessageSquare, Settings } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { initialsFromDisplayName } from '../hooks/profile-model';

export interface ProfileHeaderProps {
  user: UserSelfResponse;
  isSelf?: boolean;
  onEditProfile?: () => void;
  onSettings?: () => void;
  onMessages?: () => void;
}

export function ProfileHeader({
  user,
  isSelf = true,
  onEditProfile,
  onSettings,
  onMessages,
}: ProfileHeaderProps) {
  const theme = useTheme();
  const hit = theme.space('space.12');

  return (
    <View
      accessibilityRole="header"
      style={{
        paddingHorizontal: theme.space('space.4'),
        paddingTop: theme.space('space.4'),
        paddingBottom: theme.space('space.3'),
        gap: theme.space('space.4'),
        backgroundColor: theme.color('color.background.primary'),
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: theme.space('space.3'),
        }}
      >
        <Avatar
          size="lg"
          uri={user.avatarUrl ?? undefined}
          initials={initialsFromDisplayName(user.displayName)}
          accessibilityLabel={`${user.displayName} avatar`}
        />

        <View style={{ flexDirection: 'row', gap: theme.space('space.2') }}>
          {onMessages ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open messages"
              onPress={onMessages}
              hitSlop={8}
              style={{
                minWidth: hit,
                minHeight: hit,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: theme.radius('radius.md'),
                backgroundColor: theme.color('color.surface.secondary'),
              }}
            >
              <MessageSquare
                size={22}
                color={theme.color('color.text.secondary')}
                strokeWidth={1.75}
              />
            </Pressable>
          ) : null}
          {onSettings ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open settings"
              onPress={onSettings}
              hitSlop={8}
              style={{
                minWidth: hit,
                minHeight: hit,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: theme.radius('radius.md'),
                backgroundColor: theme.color('color.surface.secondary'),
              }}
            >
              <Settings size={22} color={theme.color('color.text.secondary')} strokeWidth={1.75} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={{ gap: theme.space('space.1') }}>
        <Text role="heading" color="color.text.primary" numberOfLines={2}>
          {user.displayName}
        </Text>
        <Text role="meta" color="color.text.secondary">
          @{user.handle}
        </Text>
        {user.bio ? (
          <Text
            role="body"
            color="color.text.secondary"
            style={{ marginTop: theme.space('space.2') }}
          >
            {user.bio}
          </Text>
        ) : null}
      </View>

      {isSelf && onEditProfile ? (
        <Button variant="secondary" accessibilityLabel="Edit profile" onPress={onEditProfile}>
          Edit Profile
        </Button>
      ) : null}
    </View>
  );
}
