import { Screen } from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';

import { ScreenHeader } from '../../src/navigation/screen-header';
import { useConnectivityStore } from '../../src/state/stores';

import { DiscoverErrorState } from './components/discover-error-state';
import { CollectionCardList, CommunityCardList, GameCardList } from './components/discover-lists';
import { DiscoverRefreshContainer } from './components/discover-refresh-container';
import { DiscoverListSkeleton } from './components/discover-skeleton';
import { EmptyDiscover } from './components/empty-discover';
import {
  useDiscoverCollections,
  useDiscoverCommunities,
  useDiscoverGames,
  useDiscoverHiddenGems,
  useDiscoverPopular,
  useDiscoverRecommended,
  useDiscoverTrending,
} from './hooks/use-discover';

function DiscoverListChrome({ title, children }: { title: string; children: ReactNode }) {
  const router = useRouter();
  return (
    <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
      <ScreenHeader
        title={title}
        titleRole="title"
        onBack={() => {
          router.back();
        }}
      />
      {children}
    </Screen>
  );
}

function DiscoverGamesSurface({
  title,
  errorTitle,
  emptyTitle,
  emptyDescription,
  list,
}: {
  title: string;
  errorTitle: string;
  emptyTitle: string;
  emptyDescription: string;
  list: {
    status: 'loading' | 'error' | 'empty' | 'ready';
    items: import('@gmrlog/types').GameCardResponse[];
    isRefreshing: boolean;
    isFetchingNextPage: boolean;
    refresh: () => void | Promise<void>;
    loadMore: () => void;
    refetch: () => unknown;
  };
}) {
  const isOnline = useConnectivityStore((s) => s.isOnline);

  return (
    <DiscoverListChrome title={title}>
      {list.status === 'loading' ? <DiscoverListSkeleton /> : null}
      {list.status === 'error' ? (
        <DiscoverRefreshContainer refreshing={list.isRefreshing} onRefresh={list.refresh}>
          <DiscoverErrorState
            title={errorTitle}
            isOffline={!isOnline}
            onRetry={() => {
              void list.refetch();
            }}
          />
        </DiscoverRefreshContainer>
      ) : null}
      {list.status === 'empty' ? (
        <DiscoverRefreshContainer refreshing={list.isRefreshing} onRefresh={list.refresh}>
          <EmptyDiscover title={emptyTitle} description={emptyDescription} />
        </DiscoverRefreshContainer>
      ) : null}
      {list.status === 'ready' ? (
        <GameCardList
          items={list.items}
          refreshing={list.isRefreshing}
          onRefresh={list.refresh}
          onEndReached={list.loadMore}
          isFetchingNextPage={list.isFetchingNextPage}
        />
      ) : null}
    </DiscoverListChrome>
  );
}

/** Discover Games — GET /discover/games. */
export function DiscoverGamesScreen() {
  const list = useDiscoverGames();
  return (
    <DiscoverGamesSurface
      title="Games"
      errorTitle="Could not load games"
      emptyTitle="No games yet"
      emptyDescription="The games catalog is empty right now. Pull to refresh."
      list={list}
    />
  );
}

/** Discover Communities — GET /discover/communities. */
export function DiscoverCommunitiesScreen() {
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const list = useDiscoverCommunities();

  return (
    <DiscoverListChrome title="Communities">
      {list.status === 'loading' ? <DiscoverListSkeleton /> : null}
      {list.status === 'error' ? (
        <DiscoverRefreshContainer refreshing={list.isRefreshing} onRefresh={list.refresh}>
          <DiscoverErrorState
            title="Could not load communities"
            isOffline={!isOnline}
            onRetry={() => {
              void list.refetch();
            }}
          />
        </DiscoverRefreshContainer>
      ) : null}
      {list.status === 'empty' ? (
        <DiscoverRefreshContainer refreshing={list.isRefreshing} onRefresh={list.refresh}>
          <EmptyDiscover
            title="No communities yet"
            description="Discoverable communities will show up here."
          />
        </DiscoverRefreshContainer>
      ) : null}
      {list.status === 'ready' ? (
        <CommunityCardList
          items={list.items}
          refreshing={list.isRefreshing}
          onRefresh={list.refresh}
          onEndReached={list.loadMore}
          isFetchingNextPage={list.isFetchingNextPage}
        />
      ) : null}
    </DiscoverListChrome>
  );
}

/** Discover Events — GET /discover/events (D3.12 EventsScreen). */
export { EventsScreen as DiscoverEventsScreen } from '../events/screens/events-screen';

/** Discover Trending — GET /discover/trending. */
export function DiscoverTrendingScreen() {
  const list = useDiscoverTrending();
  return (
    <DiscoverGamesSurface
      title="Trending"
      errorTitle="Could not load trending"
      emptyTitle="Nothing trending yet"
      emptyDescription="Trending games will appear as the culture moves."
      list={list}
    />
  );
}

/** Discover Popular — GET /discover/popular. */
export function DiscoverPopularScreen() {
  const list = useDiscoverPopular();
  return (
    <DiscoverGamesSurface
      title="Popular"
      errorTitle="Could not load popular games"
      emptyTitle="No popular games yet"
      emptyDescription="Popular picks will show up here."
      list={list}
    />
  );
}

/** Discover Hidden Gems — GET /discover/hidden-gems. */
export function DiscoverHiddenGemsScreen() {
  const list = useDiscoverHiddenGems();
  return (
    <DiscoverGamesSurface
      title="Hidden Gems"
      errorTitle="Could not load hidden gems"
      emptyTitle="No hidden gems yet"
      emptyDescription="High-praise quieter titles will land here."
      list={list}
    />
  );
}

/** Discover Recommended — GET /discover/recommended. */
export function DiscoverRecommendedScreen() {
  const list = useDiscoverRecommended();
  return (
    <DiscoverGamesSurface
      title="Recommended"
      errorTitle="Could not load recommendations"
      emptyTitle="No recommendations yet"
      emptyDescription="Taste-shaped picks appear as you play and share."
      list={list}
    />
  );
}

/** Discover Collections — GET /discover/collections. */
export function DiscoverCollectionsScreen() {
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const list = useDiscoverCollections();

  return (
    <DiscoverListChrome title="Collections">
      {list.status === 'loading' ? <DiscoverListSkeleton /> : null}
      {list.status === 'error' ? (
        <DiscoverRefreshContainer refreshing={list.isRefreshing} onRefresh={list.refresh}>
          <DiscoverErrorState
            title="Could not load collections"
            isOffline={!isOnline}
            onRetry={() => {
              void list.refetch();
            }}
          />
        </DiscoverRefreshContainer>
      ) : null}
      {list.status === 'empty' ? (
        <DiscoverRefreshContainer refreshing={list.isRefreshing} onRefresh={list.refresh}>
          <EmptyDiscover
            title="No collections yet"
            description="Public shelves worth exploring will show up here."
          />
        </DiscoverRefreshContainer>
      ) : null}
      {list.status === 'ready' ? (
        <CollectionCardList
          items={list.items}
          refreshing={list.isRefreshing}
          onRefresh={list.refresh}
          onEndReached={list.loadMore}
          isFetchingNextPage={list.isFetchingNextPage}
        />
      ) : null}
    </DiscoverListChrome>
  );
}
