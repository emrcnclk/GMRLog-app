import type {
  GameHubCollectionSummaryResponse,
  GameHubCommunitySummaryResponse,
  GameHubPlayerResponse,
} from '@gmrlog/types';
import { Screen, Text, useTheme } from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';

import { useConnectivityStore } from '../../../src/state/stores';
import { EventCard } from '../../events/components/event-card';
import { ContentErrorState } from '../components/content-error-state';
import { ContentListSkeleton } from '../components/content-list-skeleton';
import { GameHubTabShell } from '../components/game-hub-tab-shell';
import {
  useGameHubCollections,
  useGameHubCommunities,
  useGameHubEvents,
  useGameHubPlayers,
} from '../hooks/use-game-hub-tabs';

function EmptyTab({ label }: { label: string }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.space('space.6'),
      }}
    >
      <Text role="body" color="color.text.secondary">
        No {label} yet
      </Text>
    </View>
  );
}

export function GameCollectionsScreen({ gameId }: { gameId: string }) {
  const theme = useTheme();
  const router = useRouter();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const list = useGameHubCollections(gameId);

  return (
    <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
      <GameHubTabShell
        title="Collections"
        onBack={() => {
          router.back();
        }}
      >
        {list.status === 'loading' ? <ContentListSkeleton /> : null}
        {list.status === 'error' ? (
          <ContentErrorState
            isOffline={!isOnline}
            title="Could not load collections"
            onRetry={() => void list.refetch()}
          />
        ) : null}
        {list.status === 'empty' ? <EmptyTab label="collections" /> : null}
        {list.status === 'ready' ? (
          <FlatList
            data={list.items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }: { item: GameHubCollectionSummaryResponse }) => (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  router.push(`/(app)/collection/${item.id}`);
                }}
                style={{
                  paddingHorizontal: theme.space('space.4'),
                  paddingVertical: theme.space('space.3'),
                  borderBottomWidth: 1,
                  borderBottomColor: theme.color('color.border.default'),
                  gap: theme.space('space.1'),
                }}
              >
                <Text role="label">{item.title}</Text>
                <Text role="meta" color="color.text.secondary">
                  {item.owner.displayName}
                </Text>
              </Pressable>
            )}
            refreshControl={
              <RefreshControl
                refreshing={list.isRefreshing}
                onRefresh={() => void list.refresh()}
              />
            }
            contentContainerStyle={{ flexGrow: 1, paddingBottom: theme.space('space.8') }}
          />
        ) : null}
      </GameHubTabShell>
    </Screen>
  );
}

export function GameEventsScreen({ gameId }: { gameId: string }) {
  const theme = useTheme();
  const router = useRouter();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const list = useGameHubEvents(gameId);

  return (
    <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
      <GameHubTabShell
        title="Events"
        onBack={() => {
          router.back();
        }}
      >
        {list.status === 'loading' ? <ContentListSkeleton /> : null}
        {list.status === 'error' ? (
          <ContentErrorState
            isOffline={!isOnline}
            title="Could not load events"
            onRetry={() => void list.refetch()}
          />
        ) : null}
        {list.status === 'empty' ? <EmptyTab label="events" /> : null}
        {list.status === 'ready' ? (
          <FlatList
            data={list.items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <EventCard
                event={item}
                onPress={(id) => {
                  router.push(`/(app)/event/${id}`);
                }}
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={list.isRefreshing}
                onRefresh={() => void list.refresh()}
              />
            }
            contentContainerStyle={{ flexGrow: 1, paddingBottom: theme.space('space.8') }}
          />
        ) : null}
      </GameHubTabShell>
    </Screen>
  );
}

export function GameCommunitiesScreen({ gameId }: { gameId: string }) {
  const theme = useTheme();
  const router = useRouter();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const list = useGameHubCommunities(gameId);

  return (
    <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
      <GameHubTabShell
        title="Communities"
        onBack={() => {
          router.back();
        }}
      >
        {list.status === 'loading' ? <ContentListSkeleton /> : null}
        {list.status === 'error' ? (
          <ContentErrorState
            isOffline={!isOnline}
            title="Could not load communities"
            onRetry={() => void list.refetch()}
          />
        ) : null}
        {list.status === 'empty' ? <EmptyTab label="communities" /> : null}
        {list.status === 'ready' ? (
          <FlatList
            data={list.items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }: { item: GameHubCommunitySummaryResponse }) => (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  router.push(`/(app)/community/${item.id}`);
                }}
                style={{
                  paddingHorizontal: theme.space('space.4'),
                  paddingVertical: theme.space('space.3'),
                  borderBottomWidth: 1,
                  borderBottomColor: theme.color('color.border.default'),
                  gap: theme.space('space.1'),
                }}
              >
                <Text role="label">{item.name}</Text>
                <Text role="meta" color="color.text.secondary">
                  {item.memberCount} members
                </Text>
              </Pressable>
            )}
            refreshControl={
              <RefreshControl
                refreshing={list.isRefreshing}
                onRefresh={() => void list.refresh()}
              />
            }
            contentContainerStyle={{ flexGrow: 1, paddingBottom: theme.space('space.8') }}
          />
        ) : null}
      </GameHubTabShell>
    </Screen>
  );
}

export function GamePlayersScreen({ gameId }: { gameId: string }) {
  const theme = useTheme();
  const router = useRouter();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const list = useGameHubPlayers(gameId);

  return (
    <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
      <GameHubTabShell
        title="Players"
        onBack={() => {
          router.back();
        }}
      >
        {list.status === 'loading' ? <ContentListSkeleton /> : null}
        {list.status === 'error' ? (
          <ContentErrorState
            isOffline={!isOnline}
            title="Could not load players"
            onRetry={() => void list.refetch()}
          />
        ) : null}
        {list.status === 'empty' ? <EmptyTab label="players" /> : null}
        {list.status === 'ready' ? (
          <FlatList
            data={list.items}
            keyExtractor={(item) => item.user.id}
            renderItem={({ item }: { item: GameHubPlayerResponse }) => (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  router.push(`/(app)/user/${item.user.id}`);
                }}
                style={{
                  paddingHorizontal: theme.space('space.4'),
                  paddingVertical: theme.space('space.3'),
                  borderBottomWidth: 1,
                  borderBottomColor: theme.color('color.border.default'),
                  gap: theme.space('space.1'),
                }}
              >
                <Text role="label">{item.user.displayName}</Text>
                <Text role="meta" color="color.text.secondary">
                  {item.status.replace(/_/g, ' ')}
                </Text>
              </Pressable>
            )}
            refreshControl={
              <RefreshControl
                refreshing={list.isRefreshing}
                onRefresh={() => void list.refresh()}
              />
            }
            contentContainerStyle={{ flexGrow: 1, paddingBottom: theme.space('space.8') }}
          />
        ) : null}
      </GameHubTabShell>
    </Screen>
  );
}
