import type {
  CollectionResponse,
  CommunityResponse,
  EventResponse,
  GameCardResponse,
} from '@gmrlog/types';
import { useTheme } from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';

import { CollectionCard } from '../../collections/components/collection-card';

import { CommunityCard } from './community-card';
import { DiscoverCardSkeleton } from './discover-skeleton';
import { EventCard } from './event-card';
import { GameCard } from './game-card';

interface DiscoverListChromeProps {
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
  onEndReached: () => void;
  isFetchingNextPage: boolean;
}

export function GameCardList({
  items,
  refreshing,
  onRefresh,
  onEndReached,
  isFetchingNextPage,
}: DiscoverListChromeProps & { items: GameCardResponse[] }) {
  const theme = useTheme();
  const renderItem = useCallback(
    ({ item }: { item: GameCardResponse }) => <GameCard game={item} />,
    [],
  );
  const keyExtractor = useCallback((item: GameCardResponse) => item.id, []);

  return (
    <FlatList
      data={items}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            void onRefresh();
          }}
          tintColor={theme.color('color.interactive.primary')}
          colors={[theme.color('color.interactive.primary')]}
        />
      }
      ListFooterComponent={
        isFetchingNextPage ? (
          <View style={{ paddingVertical: theme.space('space.3') }}>
            <DiscoverCardSkeleton />
          </View>
        ) : (
          <View style={{ height: theme.space('space.6') }} />
        )
      }
      accessibilityRole="list"
      removeClippedSubviews
      windowSize={9}
      maxToRenderPerBatch={12}
      initialNumToRender={10}
    />
  );
}

export function CommunityCardList({
  items,
  refreshing,
  onRefresh,
  onEndReached,
  isFetchingNextPage,
}: DiscoverListChromeProps & { items: CommunityResponse[] }) {
  const theme = useTheme();
  const router = useRouter();
  const openCommunity = useCallback(
    (id: string) => {
      router.push(`/(app)/community/${id}`);
    },
    [router],
  );
  const renderItem = useCallback(
    ({ item }: { item: CommunityResponse }) => (
      <CommunityCard community={item} onPress={openCommunity} />
    ),
    [openCommunity],
  );
  const keyExtractor = useCallback((item: CommunityResponse) => item.id, []);

  return (
    <FlatList
      data={items}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            void onRefresh();
          }}
          tintColor={theme.color('color.interactive.primary')}
          colors={[theme.color('color.interactive.primary')]}
        />
      }
      ListFooterComponent={
        isFetchingNextPage ? (
          <View style={{ paddingVertical: theme.space('space.3') }}>
            <DiscoverCardSkeleton />
          </View>
        ) : (
          <View style={{ height: theme.space('space.6') }} />
        )
      }
      accessibilityRole="list"
      removeClippedSubviews
      windowSize={9}
      maxToRenderPerBatch={12}
      initialNumToRender={10}
    />
  );
}

export function EventCardList({
  items,
  refreshing,
  onRefresh,
  onEndReached,
  isFetchingNextPage,
}: DiscoverListChromeProps & { items: EventResponse[] }) {
  const theme = useTheme();
  const router = useRouter();
  const openEvent = useCallback(
    (id: string) => {
      router.push(`/(app)/event/${id}`);
    },
    [router],
  );
  const renderItem = useCallback(
    ({ item }: { item: EventResponse }) => <EventCard event={item} onPress={openEvent} />,
    [openEvent],
  );
  const keyExtractor = useCallback((item: EventResponse) => item.id, []);

  return (
    <FlatList
      data={items}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            void onRefresh();
          }}
          tintColor={theme.color('color.interactive.primary')}
          colors={[theme.color('color.interactive.primary')]}
        />
      }
      ListFooterComponent={
        isFetchingNextPage ? (
          <View style={{ paddingVertical: theme.space('space.3') }}>
            <DiscoverCardSkeleton />
          </View>
        ) : (
          <View style={{ height: theme.space('space.6') }} />
        )
      }
      accessibilityRole="list"
      removeClippedSubviews
      windowSize={9}
      maxToRenderPerBatch={12}
      initialNumToRender={10}
    />
  );
}

export function CollectionCardList({
  items,
  refreshing,
  onRefresh,
  onEndReached,
  isFetchingNextPage,
}: DiscoverListChromeProps & { items: CollectionResponse[] }) {
  const theme = useTheme();
  const router = useRouter();
  const openCollection = useCallback(
    (id: string) => {
      router.push(`/(app)/collection/${id}`);
    },
    [router],
  );
  const renderItem = useCallback(
    ({ item }: { item: CollectionResponse }) => (
      <CollectionCard collection={item} onPress={openCollection} />
    ),
    [openCollection],
  );
  const keyExtractor = useCallback((item: CollectionResponse) => item.id, []);

  return (
    <FlatList
      data={items}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            void onRefresh();
          }}
          tintColor={theme.color('color.interactive.primary')}
          colors={[theme.color('color.interactive.primary')]}
        />
      }
      ListFooterComponent={
        isFetchingNextPage ? (
          <View style={{ paddingVertical: theme.space('space.3') }}>
            <DiscoverCardSkeleton />
          </View>
        ) : (
          <View style={{ height: theme.space('space.6') }} />
        )
      }
      accessibilityRole="list"
      removeClippedSubviews
      windowSize={9}
      maxToRenderPerBatch={12}
      initialNumToRender={10}
    />
  );
}
