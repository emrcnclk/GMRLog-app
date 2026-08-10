import type { UserPublicResponse } from '@gmrlog/types';
import { Avatar, Button, type BottomSheetAnchor, Text, useTheme } from '@gmrlog/ui';
import { MoreVertical } from 'lucide-react-native';
import { memo, useRef } from 'react';
import { Pressable, View } from 'react-native';

import { initialsFromName } from '../hooks/social-model';

/** §15's row avatar — the tap-target floor, not a step on the space scale. */
const ROW_AVATAR_SIZE = 44;

export interface SocialRowProps {
  user: UserPublicResponse;
  /** Follow tab reads Follow/Following on every row; Following tab is always true. */
  isFollowing: boolean;
  followPending: boolean;
  onPressUser: (userId: string) => void;
  onToggleFollow: (userId: string, isFollowing: boolean) => void;
  onOpenMenu: (user: UserPublicResponse, anchor: BottomSheetAnchor) => void;
}

function SocialRowComponent({
  user,
  isFollowing,
  followPending,
  onPressUser,
  onToggleFollow,
  onOpenMenu,
}: SocialRowProps) {
  const theme = useTheme();
  const triggerRef = useRef<View>(null);

  const openMenu = () => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      onOpenMenu(user, { x, y, width, height });
    });
  };

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
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${user.displayName}, view profile`}
        onPress={() => {
          onPressUser(user.id);
        }}
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
          {/* §15 puts the DNA match token here (README.md). 6.1, which builds it,
              is unchecked — the row leaves the gap rather than inventing one. */}
        </View>
      </Pressable>

      <Button
        variant={isFollowing ? 'ghost' : 'accent'}
        size="sm"
        loading={followPending}
        accessibilityLabel={
          isFollowing ? `Following ${user.displayName}. Unfollow` : `Follow ${user.displayName}`
        }
        onPress={() => {
          onToggleFollow(user.id, isFollowing);
        }}
      >
        {isFollowing ? 'Following' : 'Follow'}
      </Button>

      <Pressable
        ref={triggerRef}
        accessibilityRole="button"
        accessibilityLabel={`More actions for ${user.displayName}`}
        onPress={openMenu}
        style={{
          width: 44,
          height: 44,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: theme.radius('radius.full'),
        }}
      >
        <MoreVertical size={20} color={theme.color('color.text.secondary')} strokeWidth={1.75} />
      </Pressable>
    </View>
  );
}

export const SocialRow = memo(SocialRowComponent);
