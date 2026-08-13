import { SCREEN_GUTTER, Screen, SectionKicker, useTheme } from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

import { useConnectivityStore } from '../../../src/state/stores';
import { ProfileErrorState } from '../../profile/components/profile-error-state';
import { CreatorFeaturedListsRail } from '../components/creator-featured-lists-rail';
import { CreatorHeroHeader } from '../components/creator-hero-header';
import { CreatorHubSkeleton } from '../components/creator-hub-skeleton';
import { CreatorMetricStrip } from '../components/creator-metric-strip';
import { CreatorMilestonesGrid } from '../components/creator-milestones-grid';
import { CreatorPartnershipsGap } from '../components/creator-partnerships-gap';
import { useCreatorHub } from '../hooks/use-creator-hub';

export interface CreatorHubScreenProps {
  userId: string;
}

/**
 * §25 — Creator hub. New route (`app/(app)/creator-hub/[id].tsx`), the same
 * "nothing in the app is [X]-shaped yet to extend" call §23/§24 made — except
 * this one is not organisation-shaped like Studio/Publisher: a creator is a
 * real `User`, so the header, metric strip and Featured lists are built
 * against real reads (`GET /users/:id`, `GET /users/:id/creator`), and only
 * Partnerships is a true backend gap (`CreatorPartnershipsGap`'s own doc
 * comment). Not linked from anywhere in the app's navigation — same standing
 * gap §23/§24 recorded, since nothing surfaces a creator's id to link from
 * yet. Reachable only by direct navigation to `/creator-hub/{id}`.
 *
 * No DNA match token anywhere on this screen, per §25's own closing note:
 * Publisher, Studio and Creator hub are organisation surfaces and the concept
 * is individual-only. Input to **8.3b**.
 */
export function CreatorHubScreen({ userId }: CreatorHubScreenProps) {
  const theme = useTheme();
  const router = useRouter();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const hub = useCreatorHub(userId);

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  const onPressList = useCallback(
    (collectionId: string) => {
      router.push(`/(app)/collection/${collectionId}`);
    },
    [router],
  );

  if (hub.isPending && hub.user === null) {
    return (
      <Screen edges={['bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
        <CreatorHubSkeleton />
      </Screen>
    );
  }

  if (hub.isError || hub.user === null) {
    return (
      <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
        <ProfileErrorState
          isOffline={!isOnline}
          title="Could not load this creator"
          onRetry={hub.refetch}
        />
      </Screen>
    );
  }

  const user = hub.user;

  return (
    <Screen edges={['bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={hub.isRefreshing}
            onRefresh={hub.refetch}
            tintColor={theme.color('color.interactive.primary')}
            colors={[theme.color('color.interactive.primary')]}
          />
        }
        contentContainerStyle={{
          paddingBottom: theme.space('space.10'),
          gap: theme.space('space.5'),
        }}
      >
        <CreatorHeroHeader user={user} creator={hub.creator} onBack={onBack} />

        <CreatorMetricStrip creator={hub.creator} />

        <CreatorFeaturedListsRail
          creator={hub.creator}
          isPending={hub.isSectionPending.creator}
          onPressList={onPressList}
        />

        <View
          style={{ paddingHorizontal: theme.space(SCREEN_GUTTER), gap: theme.space('space.3') }}
        >
          <SectionKicker title="Partnerships" />
          <CreatorPartnershipsGap />
        </View>

        <View
          style={{ paddingHorizontal: theme.space(SCREEN_GUTTER), gap: theme.space('space.3') }}
        >
          <SectionKicker title="Creator milestones" />
          <CreatorMilestonesGrid
            achievements={hub.achievements}
            isPending={hub.isSectionPending.achievements}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
