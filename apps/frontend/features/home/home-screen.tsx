import { Screen } from '@gmrlog/ui';
import { useRouter } from 'expo-router';

import { useConnectivityStore } from '../../src/state/stores';

import { ActivityList } from './components/activity-list';
import { EmptyFeed } from './components/empty-feed';
import { ErrorState } from './components/error-state';
import { HomeSkeleton } from './components/feed-skeleton';
import { HomeHeader } from './components/home-header';
import { RefreshContainer } from './components/refresh-container';
import { useActivityFeed } from './hooks/use-activity-feed';

/**
 * Production Home — D3.24 hybrid feed (`GET /feed`).
 * State order: Loading → Empty → Feed.
 */
export function HomeScreen() {
  const router = useRouter();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const feed = useActivityFeed();

  return (
    <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
      <HomeHeader
        onPressSearch={() => {
          router.push('/(app)/(tabs)/search');
        }}
        onPressNotifications={() => {
          router.push('/(app)/(tabs)/notifications');
        }}
      />

      {feed.status === 'loading' ? <HomeSkeleton /> : null}

      {feed.status === 'error' ? (
        <RefreshContainer refreshing={feed.isRefreshing} onRefresh={feed.refresh}>
          <ErrorState
            isOffline={!isOnline}
            onRetry={() => {
              void feed.refetch();
            }}
          />
        </RefreshContainer>
      ) : null}

      {feed.status === 'empty' ? (
        <RefreshContainer refreshing={feed.isRefreshing} onRefresh={feed.refresh}>
          <EmptyFeed
            onDiscover={() => {
              router.push('/(app)/(tabs)/discover');
            }}
          />
        </RefreshContainer>
      ) : null}

      {feed.status === 'feed' ? (
        <ActivityList
          items={feed.items}
          refreshing={feed.isRefreshing}
          onRefresh={feed.refresh}
          onEndReached={feed.loadMore}
          isFetchingNextPage={feed.isFetchingNextPage}
        />
      ) : null}
    </Screen>
  );
}
