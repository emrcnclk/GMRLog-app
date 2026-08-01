import type { UserRelationshipResponse } from '@gmrlog/types';
import { Avatar, Badge, Button, Screen, Text, useTheme } from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

import { userInitials } from '../../../shared/user/initials';
import { ScreenHeader } from '../../../src/navigation/screen-header';
import { useAuthStore } from '../../../src/state/auth-store';
import { useConnectivityStore } from '../../../src/state/stores';
import { SimilarUsersSection } from '../../discover/components/similar-users-section';
import { useSimilarUsers } from '../../discover/hooks/use-discover';
import { AchievementShowcase } from '../components/premium/achievement-showcase';
import { ArchetypeSection } from '../components/premium/archetype-card';
import { GamingInsights } from '../components/premium/gaming-insights';
import { ProfileStatsGrid } from '../components/premium/profile-stats-grid';
import { ProfileErrorState } from '../components/profile-error-state';
import { ProfileSkeleton } from '../components/profile-skeleton';
import { derivePlayerLevel } from '../hooks/profile-insights-model';
import { usePublicProfile, useSendFriendRequest } from '../hooks/use-public-profile';

export interface PublicProfileScreenProps {
  userId: string;
}

/**
 * Another player's profile (D3.28 Phase 4b) — replaces the
 * `DetailPlaceholderScreen` that stood here since D3.5.
 *
 * Everything below the identity block is the same D3.27 premium component the
 * self-profile uses; none of it is re-implemented. The hero is the exception:
 * `ProfilePremiumHero` requires `UserSelfResponse` (banner, customization,
 * private fields) which a public read does not return, so this screen composes
 * a smaller identity block from `UserPublicResponse` rather than faking a self
 * shape. Level is derived exactly as it is on the self-profile, so the same
 * player reads the same level from either side.
 */
export function PublicProfileScreen({ userId }: PublicProfileScreenProps) {
  const theme = useTheme();
  const router = useRouter();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const viewerId = useAuthStore((s) => s.user?.id);

  const profile = usePublicProfile(userId);
  const similar = useSimilarUsers(userId);
  const friendRequest = useSendFriendRequest(userId);

  const openUser = useCallback(
    (id: string) => {
      router.push(`/(app)/user/${id}`);
    },
    [router],
  );

  // Viewing yourself through a link should land on your own profile, not on a
  // read-only copy of it that cannot be edited.
  const isSelf = viewerId !== undefined && viewerId === userId;

  if (profile.isPending) {
    return (
      <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
        <ScreenHeader
          title="Profile"
          titleRole="title"
          onBack={() => {
            router.back();
          }}
        />
        <ProfileSkeleton />
      </Screen>
    );
  }

  const user = profile.user;
  if (profile.isError || user === null) {
    return (
      <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
        <ScreenHeader
          title="Profile"
          titleRole="title"
          onBack={() => {
            router.back();
          }}
        />
        <ProfileErrorState
          isOffline={!isOnline}
          title="Could not load this profile"
          onRetry={profile.refetch}
        />
      </Screen>
    );
  }

  const level = derivePlayerLevel(profile.statistics);

  return (
    <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
      <ScreenHeader
        title={user.displayName}
        titleRole="title"
        onBack={() => {
          router.back();
        }}
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: theme.space('space.10') }}
        refreshControl={
          <RefreshControl
            refreshing={profile.isRefreshing}
            onRefresh={profile.refetch}
            tintColor={theme.color('color.interactive.primary')}
            colors={[theme.color('color.interactive.primary')]}
          />
        }
      >
        <View
          style={{
            paddingHorizontal: theme.space('space.4'),
            paddingVertical: theme.space('space.5'),
            gap: theme.space('space.4'),
            alignItems: 'center',
          }}
        >
          <Avatar
            size="2xl"
            uri={user.avatarUrl ?? undefined}
            initials={userInitials(user.displayName)}
            accessibilityLabel={`${user.displayName} avatar`}
          />
          <View style={{ alignItems: 'center', gap: theme.space('space.1') }}>
            <Text role="heading" accessibilityRole="header">
              {user.displayName}
            </Text>
            <Text role="meta" color="color.text.tertiary">
              {/* Level needs statistics; without them the handle stands alone
                  rather than showing a fabricated "Level 1". */}
              {level === null
                ? `@${user.handle}`
                : `@${user.handle} · Level ${String(level.level)}`}
            </Text>
          </View>

          <RelationshipStrip
            relationship={profile.relationship}
            isSelf={isSelf}
            isSending={friendRequest.isPending}
            onSendRequest={() => {
              friendRequest.mutate();
            }}
          />
        </View>

        <ProfileStatsGrid statistics={profile.statistics} isPending={false} />

        <ArchetypeSection
          archetypes={profile.archetypes}
          isPending={profile.isSectionPending.archetypes}
        />

        <GamingInsights statistics={profile.statistics} />

        <AchievementShowcase
          achievements={profile.achievements}
          isPending={profile.isSectionPending.achievements}
        />

        <SimilarUsersSection
          items={similar.items}
          isPending={similar.isPending}
          onPressUser={openUser}
        />
      </ScrollView>
    </Screen>
  );
}

interface RelationshipStripProps {
  relationship: UserRelationshipResponse | null;
  isSelf: boolean;
  isSending: boolean;
  onSendRequest: () => void;
}

/**
 * Where this player stands relative to you.
 *
 * A blocked relationship shows nothing actionable — offering "Add friend" to
 * someone you have blocked, or who blocked you, would be a broken promise the
 * server would reject anyway.
 */
function RelationshipStrip({
  relationship,
  isSelf,
  isSending,
  onSendRequest,
}: RelationshipStripProps) {
  const theme = useTheme();

  if (isSelf || relationship === null) {
    return null;
  }

  if (relationship.isBlocked || relationship.blockedBy) {
    return null;
  }

  const status = (() => {
    if (relationship.isFriend) {
      return 'Friends';
    }
    if (relationship.requestSent) {
      return 'Request sent';
    }
    if (relationship.requestReceived) {
      return 'Wants to be friends';
    }
    return null;
  })();

  return (
    <View style={{ alignItems: 'center', gap: theme.space('space.2') }}>
      <View style={{ flexDirection: 'row', gap: theme.space('space.2'), flexWrap: 'wrap' }}>
        {status !== null ? <Badge tone="info">{status}</Badge> : null}
        {relationship.followsYou ? <Badge tone="neutral">Follows you</Badge> : null}
        {relationship.mutualFriends > 0 ? (
          <Badge tone="neutral">{`${String(relationship.mutualFriends)} mutual`}</Badge>
        ) : null}
      </View>

      {status === null ? (
        <Button
          accessibilityLabel="Send friend request"
          loading={isSending}
          onPress={onSendRequest}
        >
          Add friend
        </Button>
      ) : null}
    </View>
  );
}
