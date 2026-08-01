import { Screen, Text, useTheme } from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { ScreenHeader } from '../../src/navigation/screen-header';
import { useConnectivityStore } from '../../src/state/stores';

import { DiscoverErrorState } from './components/discover-error-state';
import { DiscoverModuleCard } from './components/discover-module-card';
import { DiscoverRefreshContainer } from './components/discover-refresh-container';
import { DiscoverHubSkeleton } from './components/discover-skeleton';
import { EmptyDiscover } from './components/empty-discover';
import { hubHrefToRoute } from './hooks/discover-model';
import { useDiscoverHub } from './hooks/use-discover';

/**
 * Discover Hub — GET /discover module registry.
 * State order: Loading → Empty → Ready.
 */
export function DiscoverHubScreen() {
  const router = useRouter();
  const theme = useTheme();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const hub = useDiscoverHub();

  return (
    <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
      <ScreenHeader title="Discover" />

      {hub.status === 'loading' ? <DiscoverHubSkeleton /> : null}

      {hub.status === 'error' ? (
        <DiscoverRefreshContainer refreshing={hub.isRefreshing} onRefresh={hub.refresh}>
          <DiscoverErrorState
            isOffline={!isOnline}
            onRetry={() => {
              void hub.refetch();
            }}
          />
        </DiscoverRefreshContainer>
      ) : null}

      {hub.status === 'empty' ? (
        <DiscoverRefreshContainer refreshing={hub.isRefreshing} onRefresh={hub.refresh}>
          <EmptyDiscover
            title="Nothing to discover yet"
            description="Discover modules will appear here when available."
          />
        </DiscoverRefreshContainer>
      ) : null}

      {hub.status === 'ready' ? (
        <DiscoverRefreshContainer
          refreshing={hub.isRefreshing}
          onRefresh={hub.refresh}
          contentContainerStyle={{
            padding: theme.space('space.4'),
            gap: theme.space('space.3'),
          }}
        >
          <Text role="body" color="color.text.secondary">
            Explore games, communities, and events — taste-first, no ranking theater.
          </Text>
          <View style={{ gap: theme.space('space.3') }}>
            {hub.modules.map((module) => (
              <DiscoverModuleCard
                key={module.id}
                module={module}
                onPress={() => {
                  const route = hubHrefToRoute(module.href);
                  if (route) {
                    router.push(`/(app)/(tabs)/discover${route}`);
                  }
                }}
              />
            ))}
          </View>
        </DiscoverRefreshContainer>
      ) : null}
    </Screen>
  );
}
