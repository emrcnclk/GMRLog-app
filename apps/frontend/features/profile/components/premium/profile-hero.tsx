import type { ProfileHeroResponse, UserSelfResponse, UserStatisticsResponse } from '@gmrlog/types';
import { Avatar, Badge, GradientScrim, ProgressBar, Skeleton, Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { View } from 'react-native';

import { userInitials } from '../../../../shared/user/initials';
import { CachedImage } from '../../../../src/assets/cached-image';
import type { ProfileBannerStyle } from '../../hooks/profile-customization-model';
import { derivePlayerLevel } from '../../hooks/profile-insights-model';

export interface ProfilePremiumHeroProps {
  user: UserSelfResponse;
  hero: ProfileHeroResponse | null;
  statistics: UserStatisticsResponse | null;
  bannerStyle: ProfileBannerStyle;
  isPending: boolean;
}

const BANNER_HEIGHT = 168;

/**
 * D3.27 Phase 2 — Profile hero.
 *
 * Banner artwork sits behind a scrim with the avatar overlapping its lower edge,
 * then level · rank · progress · member-since. Banner height is fixed so the
 * identity block below never moves when the image resolves.
 *
 * Country is intentionally absent: `UserSelfResponse` carries no country field,
 * and inventing one on the client would be a fabricated profile claim. Adding it
 * needs a `User.country` column (tracked in the D3.27 report).
 */
function ProfilePremiumHeroComponent({
  user,
  hero,
  statistics,
  bannerStyle,
  isPending,
}: ProfilePremiumHeroProps) {
  const theme = useTheme();
  const level = derivePlayerLevel(statistics);
  // Bind locally so the render below narrows to `string` without an assertion.
  const bannerUrl = bannerStyle === 'artwork' ? user.bannerUrl : null;

  const memberSince = formatMemberSince(hero?.memberSince ?? user.createdAt);

  return (
    <View>
      <View
        style={{
          height: BANNER_HEIGHT,
          backgroundColor:
            bannerStyle === 'solid'
              ? theme.color('color.accent.muted')
              : theme.color('color.background.secondary'),
          overflow: 'hidden',
        }}
      >
        {bannerUrl !== null ? (
          <CachedImage
            source={{ uri: bannerUrl }}
            priority="high"
            contentFit="cover"
            // Softened so the avatar and name stay the focal point.
            blurRadius={12}
            accessibilityIgnoresInvertColors
            accessibilityElementsHidden
            style={{ width: '100%', height: '100%' }}
          />
        ) : null}
        <GradientScrim
          direction="to-top"
          intensity={theme.tokens.scheme === 'dark' ? 0.75 : 0.35}
          rgb={theme.tokens.scheme === 'dark' ? '0,0,0' : '255,255,255'}
        />
      </View>

      <View
        style={{
          paddingHorizontal: theme.space('space.4'),
          marginTop: -(theme.space('space.20') / 2),
          gap: theme.space('space.3'),
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: theme.space('space.4'),
          }}
        >
          <View
            style={{
              borderRadius: theme.radius('radius.full'),
              borderWidth: 3,
              borderColor: theme.color('color.background.primary'),
            }}
          >
            <Avatar
              size="xl"
              initials={userInitials(user.displayName)}
              uri={user.avatarUrl ?? undefined}
              priority="high"
              accessibilityLabel={`${user.displayName} avatar`}
            />
          </View>

          {level !== null ? (
            <View
              style={{
                flex: 1,
                paddingBottom: theme.space('space.2'),
                gap: theme.space('space.1'),
              }}
            >
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space('space.2') }}
              >
                <Badge tone="info">{`Level ${String(level.level)}`}</Badge>
                <Text role="label" color="color.accent.default">
                  {level.rank}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        <View style={{ gap: theme.space('space.1') }}>
          <Text role="heading" numberOfLines={2}>
            {user.displayName}
          </Text>
          <Text role="label" color="color.text.tertiary">
            @{user.handle}
          </Text>
          {user.bio !== null && user.bio.length > 0 ? (
            <Text role="body" color="color.text.secondary">
              {user.bio}
            </Text>
          ) : null}
        </View>

        {isPending && statistics === null ? (
          <Skeleton shape="line" width="60%" />
        ) : level !== null ? (
          <View style={{ gap: theme.space('space.2') }}>
            <ProgressBar
              value={level.points - level.levelFloor}
              target={level.nextLevelAt - level.levelFloor}
              accessibilityLabel={`Level ${String(level.level)} progress`}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text role="meta" color="color.text.tertiary">
                {`${String(level.points - level.levelFloor)} / ${String(
                  level.nextLevelAt - level.levelFloor,
                )} to level ${String(level.level + 1)}`}
              </Text>
              {memberSince !== null ? (
                <Text role="meta" color="color.text.tertiary">
                  Member since {memberSince}
                </Text>
              ) : null}
            </View>
          </View>
        ) : memberSince !== null ? (
          <Text role="meta" color="color.text.tertiary">
            Member since {memberSince}
          </Text>
        ) : null}

        {hero !== null ? <HeroSignals hero={hero} /> : null}
      </View>
    </View>
  );
}

/** Reputation and creator marks from the D3.24 Profile Hero read. */
function HeroSignals({ hero }: { hero: ProfileHeroResponse }) {
  const theme = useTheme();

  if (hero.reputationBadges.length === 0 && !hero.creatorBadge && hero.topGenre === null) {
    return null;
  }

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space('space.2') }}>
      {hero.creatorBadge ? <Badge tone="success">Creator</Badge> : null}
      {hero.reputationBadges.map((badge) => (
        <Badge key={badge} tone="neutral">
          {badge.replace(/_/g, ' ')}
        </Badge>
      ))}
      {hero.topGenre !== null ? <Badge tone="neutral">{hero.topGenre}</Badge> : null}
    </View>
  );
}

function formatMemberSince(iso: string | null | undefined): string | null {
  if (iso == null) {
    return null;
  }
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return new Date(parsed).toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
}

export const ProfilePremiumHero = memo(ProfilePremiumHeroComponent);
