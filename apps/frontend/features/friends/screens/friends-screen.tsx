import { Screen, Text, useTheme } from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, RefreshControl } from 'react-native';

import { mapAuthError } from '../../../src/auth/map-auth-error';
import { ScreenHeader } from '../../../src/navigation/screen-header';
import { useConnectivityStore } from '../../../src/state/stores';
import { EmptyFriends } from '../components/empty-friends';
import { FriendCard } from '../components/friend-card';
import { FriendRequestCard } from '../components/friend-request-card';
import { FriendsErrorState } from '../components/friends-error-state';
import { FriendsSkeleton } from '../components/friends-skeleton';
import {
  useAcceptFriendRequest,
  useFriendsScreenData,
  useRejectFriendRequest,
} from '../hooks/use-friends';

type FriendsListRow =
  | { kind: 'section'; id: string; title: string }
  | { kind: 'request'; id: string; requestId: string }
  | { kind: 'friend'; id: string; friendshipId: string };

/** Friends screen — incoming requests + friends list · accept/reject. */
export function FriendsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const list = useFriendsScreenData();
  const accept = useAcceptFriendRequest();
  const reject = useRejectFriendRequest();

  const onAccept = useCallback(
    (requestId: string) => {
      accept.mutate(requestId);
    },
    [accept],
  );

  const onReject = useCallback(
    (requestId: string) => {
      reject.mutate(requestId);
    },
    [reject],
  );

  const openUser = useCallback(
    (userId: string) => {
      router.push(`/(app)/user/${userId}`);
    },
    [router],
  );

  const rows: FriendsListRow[] = [];
  if (list.status === 'ready') {
    if (list.requests.length > 0) {
      rows.push({ kind: 'section', id: 'section-requests', title: 'Requests' });
      for (const request of list.requests) {
        rows.push({ kind: 'request', id: `request-${request.id}`, requestId: request.id });
      }
    }
    if (list.friends.length > 0) {
      rows.push({ kind: 'section', id: 'section-friends', title: 'Friends' });
      for (const friendship of list.friends) {
        rows.push({
          kind: 'friend',
          id: `friend-${friendship.user.id}`,
          friendshipId: friendship.user.id,
        });
      }
    }
  }

  const requestById = new Map(list.requests.map((item) => [item.id, item]));
  const friendById = new Map(list.friends.map((item) => [item.user.id, item]));

  return (
    <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
      <ScreenHeader
        title="Friends"
        onBack={() => {
          router.back();
        }}
      />

      {list.status === 'loading' ? <FriendsSkeleton /> : null}

      {list.status === 'error' ? (
        <FriendsErrorState
          title={mapAuthError(list.error, isOnline).title}
          description={mapAuthError(list.error, isOnline).description}
          isOffline={!isOnline}
          onRetry={() => {
            void list.refetch();
          }}
        />
      ) : null}

      {list.status === 'empty' ? (
        <FlatList
          data={[]}
          renderItem={() => null}
          ListEmptyComponent={<EmptyFriends />}
          refreshControl={
            <RefreshControl
              refreshing={list.isRefreshing}
              onRefresh={() => {
                void list.refresh();
              }}
              tintColor={theme.color('color.interactive.primary')}
              colors={[theme.color('color.interactive.primary')]}
            />
          }
          contentContainerStyle={{ flexGrow: 1 }}
        />
      ) : null}

      {list.status === 'ready' ? (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            if (item.kind === 'section') {
              return (
                <Text
                  role="title"
                  color="color.text.primary"
                  style={{
                    paddingHorizontal: theme.space('space.4'),
                    paddingTop: theme.space('space.4'),
                    paddingBottom: theme.space('space.2'),
                  }}
                >
                  {item.title}
                </Text>
              );
            }
            if (item.kind === 'request') {
              const request = requestById.get(item.requestId);
              if (!request) {
                return null;
              }
              return (
                <FriendRequestCard
                  request={request}
                  acceptPending={accept.isPending && accept.variables === request.id}
                  rejectPending={reject.isPending && reject.variables === request.id}
                  onAccept={onAccept}
                  onReject={onReject}
                />
              );
            }
            const friendship = friendById.get(item.friendshipId);
            if (!friendship) {
              return null;
            }
            return <FriendCard friendship={friendship} onPress={openUser} />;
          }}
          refreshControl={
            <RefreshControl
              refreshing={list.isRefreshing}
              onRefresh={() => {
                void list.refresh();
              }}
              tintColor={theme.color('color.interactive.primary')}
              colors={[theme.color('color.interactive.primary')]}
            />
          }
          contentContainerStyle={{ flexGrow: 1, paddingBottom: theme.space('space.4') }}
          accessibilityRole="list"
          initialNumToRender={12}
          windowSize={9}
          maxToRenderPerBatch={12}
          removeClippedSubviews
        />
      ) : null}
    </Screen>
  );
}
