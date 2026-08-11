import type { ReportReasonValue, UserPublicResponse } from '@gmrlog/types';
import {
  type BottomSheetAnchor,
  Button,
  EmptyState,
  ErrorState,
  EntityList,
  SCREEN_GUTTER,
  Screen,
  SearchField,
  SegmentedTabs,
  useTheme,
} from '@gmrlog/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';

import { mapAuthError } from '../../../src/auth/map-auth-error';
import { ScreenHeader } from '../../../src/navigation/screen-header';
import { useConnectivityStore } from '../../../src/state/stores';
import { BlockedRow } from '../components/blocked-row';
import { SocialActionMenu } from '../components/social-action-menu';
import { SocialRow } from '../components/social-row';
import { SocialSkeleton } from '../components/social-skeleton';
import {
  filterSocialRows,
  followingIdSet,
  isFollowingUser,
  SOCIAL_TABS,
  type SocialTabId,
} from '../hooks/social-model';
import {
  useBlockUser,
  useFollowUser,
  useMuteUser,
  useMyBlocked,
  useMyFollowers,
  useMyFollowing,
  useReportUser,
  useUnblockUser,
  useUnfollowUser,
} from '../hooks/use-social';

/**
 * §15 — Followers & following. Scoped 2026-08-10 (3b.3), built here.
 * Blocked tab built in 3b.3a, against the new `GET /blocks`.
 *
 * Followers and Following are real, against `GET /me/followers` and
 * `GET /me/following`. Blocked is real against `GET /blocks`, cursor-
 * paginated rather than the other two tabs' unpaginated shape — a block
 * list has no measured small-list precedent the way followers/following did.
 */
export function FollowersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const params = useLocalSearchParams<{ tab?: string }>();
  const initialTab: SocialTabId = params.tab === 'following' ? 'following' : 'followers';

  const [tab, setTab] = useState<SocialTabId>(initialTab);
  const [query, setQuery] = useState('');
  const [menuUser, setMenuUser] = useState<UserPublicResponse | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<BottomSheetAnchor | null>(null);

  const followers = useMyFollowers();
  const following = useMyFollowing();
  const blocked = useMyBlocked();
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();
  const muteMutation = useMuteUser();
  const blockMutation = useBlockUser();
  const unblockMutation = useUnblockUser();
  const reportMutation = useReportUser();

  const followingIds = useMemo(() => followingIdSet(following.items), [following.items]);

  const activeView = tab === 'following' ? following : followers;
  const rows = useMemo(
    () => (tab === 'blocked' ? [] : filterSocialRows(activeView.items, query)),
    [tab, activeView.items, query],
  );

  const tabItems = useMemo(
    () =>
      SOCIAL_TABS.map((item) => ({
        ...item,
        count:
          item.id === 'followers'
            ? followers.items.length
            : item.id === 'following'
              ? following.items.length
              : blocked.items.length,
      })),
    [followers.items.length, following.items.length, blocked.items.length],
  );

  const openProfile = useCallback(
    (userId: string) => {
      router.push(`/(app)/user/${userId}`);
    },
    [router],
  );

  const openMenu = useCallback((user: UserPublicResponse, anchor: BottomSheetAnchor) => {
    setMenuUser(user);
    setMenuAnchor(anchor);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuUser(null);
    setMenuAnchor(null);
  }, []);

  const toggleFollow = useCallback(
    (userId: string, currentlyFollowing: boolean) => {
      if (currentlyFollowing) {
        unfollowMutation.mutate(userId);
      } else {
        followMutation.mutate(userId);
      }
    },
    [followMutation, unfollowMutation],
  );

  const isTogglePending = useCallback(
    (userId: string) =>
      (followMutation.isPending && followMutation.variables === userId) ||
      (unfollowMutation.isPending && unfollowMutation.variables === userId),
    [followMutation, unfollowMutation],
  );

  const handleReport = useCallback(
    (userId: string, reason: ReportReasonValue) => {
      reportMutation.mutate({ userId, reason });
      closeMenu();
    },
    [closeMenu, reportMutation],
  );

  const content = (() => {
    if (tab === 'blocked') {
      if (blocked.status === 'loading') {
        return <SocialSkeleton />;
      }

      if (blocked.status === 'error') {
        const mapped = mapAuthError(blocked.error, isOnline);
        return (
          <ErrorState
            style={{ flexGrow: 1 }}
            title={mapped.title}
            description={mapped.description}
            action={
              <Button
                variant="secondary"
                accessibilityLabel="Retry"
                onPress={() => {
                  void blocked.refetch();
                }}
              >
                Retry
              </Button>
            }
          />
        );
      }

      if (blocked.status === 'empty') {
        return (
          <EmptyState
            fill
            icon="shield-off"
            title="No blocked accounts"
            description="Accounts you block will show up here."
          />
        );
      }

      return (
        <EntityList
          items={blocked.items}
          keyExtractor={(block) => block.blocked.id}
          renderItem={(block) => (
            <BlockedRow
              user={block.blocked}
              unblockPending={
                unblockMutation.isPending && unblockMutation.variables === block.blocked.id
              }
              onUnblock={(userId) => {
                unblockMutation.mutate(userId);
              }}
            />
          )}
          refreshing={blocked.isRefreshing}
          onRefresh={() => {
            void blocked.refresh();
          }}
          onEndReached={blocked.loadMore}
          accessibilityLabel="Blocked accounts"
        />
      );
    }

    if (activeView.status === 'loading') {
      return <SocialSkeleton />;
    }

    if (activeView.status === 'error') {
      const mapped = mapAuthError(activeView.error, isOnline);
      return (
        <ErrorState
          style={{ flexGrow: 1 }}
          title={mapped.title}
          description={mapped.description}
          action={
            <Button
              variant="secondary"
              accessibilityLabel="Retry"
              onPress={() => {
                void activeView.refetch();
              }}
            >
              Retry
            </Button>
          }
        />
      );
    }

    if (activeView.status === 'empty') {
      return (
        <EmptyState
          fill
          icon="users"
          title={tab === 'following' ? 'Not following anyone yet' : 'No followers yet'}
          description={
            tab === 'following'
              ? 'Accounts you follow will show up here.'
              : 'Accounts that follow you will show up here.'
          }
        />
      );
    }

    if (rows.length === 0) {
      return (
        <EmptyState fill icon="search" title="No matches" description="Try a different search." />
      );
    }

    return (
      <EntityList
        items={rows}
        keyExtractor={(user) => user.id}
        renderItem={(user) => (
          <SocialRow
            user={user}
            isFollowing={tab === 'following' ? true : isFollowingUser(followingIds, user.id)}
            followPending={isTogglePending(user.id)}
            onPressUser={openProfile}
            onToggleFollow={toggleFollow}
            onOpenMenu={openMenu}
          />
        )}
        refreshing={activeView.isRefreshing}
        onRefresh={() => {
          void activeView.refresh();
        }}
        accessibilityLabel={tab === 'following' ? 'Following' : 'Followers'}
      />
    );
  })();

  return (
    <Screen edges={[]}>
      <ScreenHeader
        title="Followers & following"
        onBack={() => {
          router.back();
        }}
      />

      {tab === 'blocked' ? null : (
        <View
          style={{
            paddingHorizontal: theme.space(SCREEN_GUTTER),
            paddingBottom: theme.space('space.2'),
          }}
        >
          <SearchField
            placeholder="Search"
            value={query}
            onChangeText={setQuery}
            onClear={() => {
              setQuery('');
            }}
            accessibilityLabel="Search followers and following"
          />
        </View>
      )}

      <SegmentedTabs
        items={tabItems}
        activeId={tab}
        onChange={setTab}
        variant="underline"
        accessibilityLabel="Followers and following sections"
      />

      <View style={{ flex: 1 }}>{content}</View>

      <SocialActionMenu
        user={menuUser}
        anchor={menuAnchor}
        onClose={closeMenu}
        onViewProfile={openProfile}
        onMute={(userId) => {
          muteMutation.mutate(userId);
          closeMenu();
        }}
        onBlock={(userId) => {
          blockMutation.mutate(userId);
          closeMenu();
        }}
        onReport={handleReport}
        mutePending={muteMutation.isPending}
        blockPending={blockMutation.isPending}
        reportPending={reportMutation.isPending}
      />
    </Screen>
  );
}
