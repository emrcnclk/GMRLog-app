import type { ProfileHeroResponse, UserSelfResponse } from '@gmrlog/types';
import { Avatar, SCREEN_GUTTER, Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { View } from 'react-native';

import { userInitials } from '../../../../shared/user/initials';
import { formatRecordSince } from '../../hooks/player-record-model';

export interface ProfileMonolithHeroProps {
  user: UserSelfResponse;
  hero: ProfileHeroResponse | null;
}

/**
 * §6's first alternate: "a `38px weight 300` name on plain background, no card".
 *
 * Kept behind the hero variant switch beside the record card and the banner. The
 * name lands on `display` (40px / 300) — the ramp's only 300-weight role at that
 * size, and one step from the doc's 38. Everything else is space.
 */
function ProfileMonolithHeroComponent({ user, hero }: ProfileMonolithHeroProps) {
  const theme = useTheme();
  const since = formatRecordSince(hero?.memberSince ?? user.createdAt);

  return (
    <View
      style={{
        paddingHorizontal: theme.space(SCREEN_GUTTER),
        paddingTop: theme.space('space.6'),
        paddingBottom: theme.space('space.5'),
        gap: theme.space('space.4'),
      }}
    >
      <Avatar
        size="lg"
        initials={userInitials(user.displayName)}
        uri={user.avatarUrl ?? undefined}
        priority="high"
        accessibilityLabel={`${user.displayName} avatar`}
      />

      <View style={{ gap: theme.space('space.2') }}>
        <Text role="display" numberOfLines={2}>
          {user.displayName}
        </Text>
        <Text role="meta" color="color.text.tertiary">
          @{user.handle}
          {since === null ? '' : ` · Since ${since}`}
        </Text>
      </View>

      {user.bio !== null && user.bio.length > 0 ? (
        <Text role="body" color="color.text.secondary">
          {user.bio}
        </Text>
      ) : null}
    </View>
  );
}

export const ProfileMonolithHero = memo(ProfileMonolithHeroComponent);
