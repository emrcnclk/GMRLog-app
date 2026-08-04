import {
  Button,
  EmptyState,
  ErrorState,
  SCREEN_GUTTER,
  ScreenTitle,
  Screen,
  SectionKicker,
  Skeleton,
  SkeletonBlock,
  useTheme,
} from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { RefreshControl, SectionList, View } from 'react-native';

import { mapAuthError } from '../../../src/auth/map-auth-error';
import { useConnectivityStore } from '../../../src/state/stores';
import { AchievementPlate } from '../components/achievement-plate';
import { achievementTotals, buildShowcaseGroups } from '../hooks/achievement-showcase-model';
import { useMeAchievements } from '../hooks/use-profile-social';

/**
 * Achievements (`SCREEN_REDESIGNS.md` §8) — its own screen, where it used to be
 * a section inside Profile.
 *
 * Two things about the composition are load-bearing for the twenty-three screens
 * that inherit from it. **The title belongs to the content:** it is the list's
 * header, so it scrolls away with the rows rather than sitting in a `NavHeader`
 * above them. And **every section opens with a kicker** — a tracked-out
 * monospace rule, never an 18px heading.
 *
 * Grouping, rarity and ordering all come from `achievement-showcase-model.ts`
 * unchanged; this task recomposes the surface, not the data.
 */
export function AchievementsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const isOnline = useConnectivityStore((state) => state.isOnline);
  const achievements = useMeAchievements();

  const groups = useMemo(() => buildShowcaseGroups(achievements.items), [achievements.items]);
  const totals = useMemo(() => achievementTotals(achievements.items), [achievements.items]);

  const gutter = theme.space(SCREEN_GUTTER);

  const header = (
    <ScreenTitle
      title="Achievements"
      backLabel="← Profile"
      onPressBack={() => {
        router.back();
      }}
      meta={`${totals.awarded.toLocaleString()} of ${totals.total.toLocaleString()} unlocked · ${String(totals.percent)}%`}
      progressValue={totals.awarded}
      progressTarget={totals.total}
    />
  );

  if (achievements.isPending && achievements.items.length === 0) {
    return (
      <Screen edges={['top']}>
        {header}
        <SkeletonBlock
          accessibilityLabel="Loading achievements"
          style={{ paddingHorizontal: gutter, gap: theme.space('space.3') }}
        >
          <Skeleton shape="line" width="30%" />
          <Skeleton shape="rect" height={theme.space('space.16')} />
          <Skeleton shape="rect" height={theme.space('space.16')} />
          <Skeleton shape="rect" height={theme.space('space.16')} />
        </SkeletonBlock>
      </Screen>
    );
  }

  if (achievements.isError) {
    const mapped = mapAuthError(achievements.error, isOnline);
    return (
      <Screen edges={['top']}>
        {header}
        <ErrorState
          title={mapped.title}
          description={mapped.description}
          action={
            <Button
              variant="secondary"
              onPress={() => {
                void achievements.refetch();
              }}
            >
              Try again
            </Button>
          }
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <SectionList
        sections={groups.map((group) => ({ group, data: group.achievements }))}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        renderSectionHeader={({ section }) => (
          <SectionKicker
            title={section.group.title}
            counter={`${String(section.group.awardedCount)}/${String(section.group.achievements.length)}`}
            style={{
              paddingHorizontal: gutter,
              paddingTop: theme.space('space.5'),
              paddingBottom: theme.space('space.3'),
            }}
          />
        )}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: gutter, paddingBottom: theme.space('space.2') }}>
            <AchievementPlate achievement={item} />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            title="No achievements yet"
            description="Log a game, write a review, or start a collection — badges unlock as you go."
            icon="trophy"
            fill
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={achievements.isRefreshing}
            onRefresh={() => {
              void achievements.refetch();
            }}
            tintColor={theme.color('color.interactive.primary')}
            colors={[theme.color('color.interactive.primary')]}
          />
        }
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: theme.space('space.8'), flexGrow: 1 }}
        initialNumToRender={8}
        windowSize={7}
        removeClippedSubviews
      />
    </Screen>
  );
}
