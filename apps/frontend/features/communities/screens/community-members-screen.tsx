import type { CommunityMemberResponse } from '@gmrlog/types';
import { Screen, SectionKicker, useTheme } from '@gmrlog/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';

import { mapAuthError } from '../../../src/auth/map-auth-error';
import { ScreenHeader } from '../../../src/navigation/screen-header';
import { useConnectivityStore } from '../../../src/state/stores';
import { CommunityErrorState } from '../components/community-error-state';
import { CommunityMemberCard } from '../components/community-member-card';
import { CommunityMembersSkeleton } from '../components/community-skeleton';
import { ContributionBoard } from '../components/contribution-board';
import { EmptyMembers } from '../components/empty-members';
import { ModeratorsRail } from '../components/moderators-rail';
import { useCommunityLeaderboard, useCommunityMembers } from '../hooks/use-communities';

/**
 * Members — README §2. Three sections in one scroll: the moderators &
 * contributors rail (7.2), the 90-day contribution board (7.3), then the
 * existing member list (7.4), unchanged in order — GET /communities/{id}/members
 * (backend join order). The rail and the board both read fields the members
 * and leaderboard endpoints already return; neither queries anything twice.
 */
export function CommunityMembersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const communityId = typeof params.id === 'string' ? params.id : '';
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const members = useCommunityMembers(communityId);
  const leaderboard = useCommunityLeaderboard(communityId);

  const renderItem = useCallback(
    ({ item }: { item: CommunityMemberResponse }) => <CommunityMemberCard member={item} />,
    [],
  );

  const keyExtractor = useCallback(
    (item: CommunityMemberResponse) => `${item.user.id}-${item.joinedAt}`,
    [],
  );

  const listHeader = useCallback(
    () => (
      <View style={{ gap: theme.space('space.4'), paddingBottom: theme.space('space.4') }}>
        <ModeratorsRail members={members.items} />
        <ContributionBoard leaderboard={leaderboard} />
        <View style={{ paddingHorizontal: theme.space('space.4') }}>
          <SectionKicker title="Top members" />
        </View>
      </View>
    ),
    [theme, members.items, leaderboard],
  );

  return (
    <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
      <ScreenHeader
        title="Members"
        titleRole="title"
        onBack={() => {
          router.back();
        }}
      />

      {members.status === 'loading' ? <CommunityMembersSkeleton /> : null}

      {members.status === 'error' ? (
        <CommunityErrorState
          title={mapAuthError(members.error, isOnline).title}
          description={mapAuthError(members.error, isOnline).description}
          isOffline={!isOnline}
          onRetry={() => {
            void members.refetch();
          }}
        />
      ) : null}

      {members.status === 'empty' ? <EmptyMembers /> : null}

      {members.status === 'ready' ? (
        <FlatList
          data={members.items}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListHeaderComponent={listHeader}
          refreshControl={
            <RefreshControl
              refreshing={members.isRefreshing}
              onRefresh={() => {
                void members.refresh();
                void leaderboard.refetch();
              }}
              tintColor={theme.color('color.interactive.primary')}
              colors={[theme.color('color.interactive.primary')]}
            />
          }
          contentContainerStyle={{ flexGrow: 1, paddingBottom: theme.space('space.8') }}
          accessibilityRole="list"
          initialNumToRender={16}
          windowSize={9}
          maxToRenderPerBatch={16}
          removeClippedSubviews
        />
      ) : null}
    </Screen>
  );
}
