import { FadeInView, IconButton, SCREEN_GUTTER, Screen, SegmentedTabs, useTheme } from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { Settings2, Sparkles } from 'lucide-react-native';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useConnectivityStore } from '../../src/state/stores';

import { CollectionCard } from './components/collection-card';
import { EditProfileModal } from './components/edit-profile-modal';
import { EmptyCollections } from './components/empty-collections';
import { EmptyReviews } from './components/empty-reviews';
import { EmptyTierLists } from './components/empty-tier-lists';
import { LibrarySkeleton } from './components/library-skeleton';
import { GameShelves } from './components/premium/game-shelves';
import { PlayerRecordCard } from './components/premium/player-record-card';
import { ProfilePremiumHero } from './components/premium/profile-hero';
import { ProfileMonolithHero } from './components/premium/profile-monolith-hero';
import { ProfileOverview } from './components/premium/profile-overview';
import { ProfileStatsGrid } from './components/premium/profile-stats-grid';
import { ProfileErrorState } from './components/profile-error-state';
import { ProfileRefreshContainer } from './components/profile-refresh-container';
import { ProfileSkeleton } from './components/profile-skeleton';
import { TierListCard } from './components/tier-list-card';
import { PROFILE_TAB_LABELS, PROFILE_TABS, type ProfileTabId } from './hooks/profile-model';
import { useProfileScreenData, useProfileTab } from './hooks/use-profile';
import { useProfileCustomization } from './hooks/use-profile-customization';
import { useProfileHero } from './hooks/use-profile-hero';
import { useReviews } from './hooks/use-reviews';
import { useMeStatisticsHistory } from './hooks/use-statistics-history';

/**
 * D3.27 — Premium profile.
 *
 * Hero (banner · avatar · level · rank) → headline statistics → tabs. The
 * Overview tab composes the player's configured widgets; Library is the Steam-
 * style shelf showcase. Tab chrome comes from the design system's SegmentedTabs
 * so it matches the Game Hub exactly.
 */
export function ProfileScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const { tab, setTab } = useProfileTab();
  const data = useProfileScreenData();
  const reviews = useReviews();
  const heroUserId = data.profile.user?.id ?? '';
  const hero = useProfileHero(heroUserId);
  const history = useMeStatisticsHistory('daily');
  const { customization } = useProfileCustomization();

  const [editOpen, setEditOpen] = useState(false);

  const goDiscover = useCallback(() => {
    router.push('/(app)/(tabs)/discover');
  }, [router]);

  const createCollection = useCallback(() => {
    router.push('/(app)/collections/create');
  }, [router]);

  const createTierList = useCallback(() => {
    router.push('/(app)/tier-lists/create');
  }, [router]);

  const openSettings = useCallback(() => {
    router.push('/(settings)');
  }, [router]);

  /** §15 — the stat tiles used to both open Friends, a placeholder for the
   * mutual-friendship domain rather than the asymmetric follow lists §15
   * actually specifies (3b.3). */
  const openFollowers = useCallback(() => {
    router.push('/(app)/followers?tab=followers');
  }, [router]);

  const openFollowing = useCallback(() => {
    router.push('/(app)/followers?tab=following');
  }, [router]);

  /**
   * §6's "tapping opens the badge case" — the Achievements screen from 3.1.
   * 9.5e: opens straight into the equip picker rather than the plain list.
   */
  const openBadgePicker = useCallback(() => {
    router.push('/(app)/achievements?mode=pick');
  }, [router]);

  const openGame = useCallback(
    (gameId: string) => {
      router.push(`/(app)/game/${gameId}`);
    },
    [router],
  );

  const openCollection = useCallback(
    (id: string) => {
      router.push(`/(app)/collection/${id}`);
    },
    [router],
  );

  const openTierList = useCallback(
    (id: string) => {
      router.push(`/(app)/tier-list/${id}`);
    },
    [router],
  );

  const openUser = useCallback(
    (userId: string) => {
      router.push(`/(app)/user/${userId}`);
    },
    [router],
  );

  const openRoute = useCallback(
    (route: string) => {
      router.push(route);
    },
    [router],
  );

  const tabItems = useMemo(
    () => PROFILE_TABS.map((id) => ({ id, label: PROFILE_TAB_LABELS[id] })),
    [],
  );

  const libraryEntries = data.library.status === 'ready' ? data.library.items : [];
  const collections = data.collections.status === 'ready' ? data.collections.items : [];

  /**
   * The shell is full-bleed now (`edges={['bottom']}`) so the recomposed content
   * owns the 20px gutter end to end. A row that does not already carry one gets
   * it here — not on `contentContainerStyle`, which would also indent the header
   * block, whose card, strip and tabs each carry their own. `CollectionCard`
   * brings its own `SCREEN_GUTTER` margin (3.5) and so is left alone.
   */
  const listRow = (children: ReactNode) => (
    <View style={{ paddingHorizontal: theme.space(SCREEN_GUTTER) }}>{children}</View>
  );

  if (data.profile.status === 'loading') {
    return (
      <Screen edges={['bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
        <View style={{ paddingTop: insets.top }}>
          <ProfileSkeleton />
        </View>
      </Screen>
    );
  }

  if (data.profile.status === 'error' || data.profile.status === 'empty' || !data.profile.user) {
    return (
      <Screen edges={['bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
        <View style={{ flex: 1, paddingTop: insets.top }}>
          <ProfileRefreshContainer refreshing={data.isRefreshing} onRefresh={data.refresh}>
            <ProfileErrorState
              isOffline={!isOnline}
              onRetry={() => {
                void data.profile.refetch();
              }}
            />
          </ProfileRefreshContainer>
        </View>
      </Screen>
    );
  }

  const user = data.profile.user;

  // The banner alternate is artwork, so its controls float over it; the record
  // card and the monolith have no artwork to float on, and a floating control
  // would land on the card's own header line.
  const floatingActions = customization.heroStyle === 'banner';

  const actions = (
    <View
      style={{
        ...(floatingActions
          ? {
              position: 'absolute' as const,
              top: insets.top + theme.space('space.2'),
              right: theme.space('space.3'),
              zIndex: 2,
            }
          : {
              paddingTop: insets.top + theme.space('space.2'),
              paddingRight: theme.space('space.3'),
              justifyContent: 'flex-end' as const,
            }),
        flexDirection: 'row',
        gap: theme.space('space.2'),
      }}
    >
      <IconButton
        accessibilityLabel="Customize profile"
        onPress={() => {
          router.push('/(app)/profile/customize');
        }}
      >
        <Sparkles size={18} color={theme.color('color.text.primary')} />
      </IconButton>
      <IconButton accessibilityLabel="Open settings" onPress={openSettings}>
        <Settings2 size={18} color={theme.color('color.text.primary')} />
      </IconButton>
    </View>
  );

  const header = (
    <View>
      {actions}

      {/* §6 ships three hero treatments; the record card is the one the doc says
          to build, and the other two stay reachable behind the variant switch. */}
      {customization.heroStyle === 'card' ? (
        <PlayerRecordCard
          user={user}
          hero={hero.hero}
          statistics={data.statistics.statistics}
          archetypes={data.archetypes.items}
          achievements={data.achievements.items}
          pins={data.pins.items}
          isPending={data.statistics.isPending}
          onPressBadgeCase={openBadgePicker}
        />
      ) : customization.heroStyle === 'monolith' ? (
        <ProfileMonolithHero user={user} hero={hero.hero} />
      ) : (
        <>
          <ProfilePremiumHero
            user={user}
            hero={hero.hero}
            statistics={data.statistics.statistics}
            bannerStyle={customization.bannerStyle}
            isPending={data.statistics.isPending}
          />
          <View style={{ height: theme.space('space.4') }} />
        </>
      )}

      <ProfileStatsGrid
        statistics={data.statistics.statistics}
        isPending={data.statistics.isPending}
        onPressFollowers={openFollowers}
        onPressFollowing={openFollowing}
        onPressLibrary={() => {
          setTab('library');
        }}
      />

      <View style={{ height: theme.space('space.4') }} />

      {/* §6 asks for pill tabs here; `SegmentedTabs` already carries that
          variant, so this is a prop, not a second tab strip. */}
      <SegmentedTabs
        items={tabItems}
        activeId={tab}
        variant="pill"
        onChange={(next: ProfileTabId) => {
          setTab(next);
        }}
        accessibilityLabel="Profile sections"
      />
    </View>
  );

  const listProps = {
    refreshing: data.isRefreshing,
    onRefresh: () => {
      void data.refresh();
    },
    ListHeaderComponent: header,
    contentContainerStyle: {
      flexGrow: 1,
      paddingBottom: theme.space('space.10'),
    },
    initialNumToRender: 8,
    windowSize: 7,
    removeClippedSubviews: true,
  };

  // Header stays static across tab changes; only the panel animates in, so the
  // hero never re-plays its entrance and nothing above the fold shifts.
  const scrollableTab = (children: ReactNode) => (
    <ProfileRefreshContainer refreshing={data.isRefreshing} onRefresh={data.refresh}>
      {header}
      <FadeInView triggerKey={tab}>{children}</FadeInView>
    </ProfileRefreshContainer>
  );

  return (
    <Screen edges={['bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
      {tab === 'overview'
        ? scrollableTab(
            <ProfileOverview
              customization={customization}
              statistics={data.statistics.statistics}
              history={history.history}
              archetypes={data.archetypes.items}
              achievements={data.achievements.items}
              libraryEntries={libraryEntries}
              collections={collections}
              recentActivity={data.activity.items}
              isPending={data.statistics.isPending}
              onPressGame={openGame}
              onPressCollection={openCollection}
              onPressRoute={openRoute}
              onPressUser={openUser}
            />,
          )
        : null}

      {tab === 'library'
        ? data.library.status === 'loading'
          ? scrollableTab(<LibrarySkeleton />)
          : data.library.status === 'error'
            ? scrollableTab(
                <ProfileErrorState
                  title="Could not load library"
                  isOffline={!isOnline}
                  onRetry={() => {
                    void data.library.refetch();
                  }}
                />,
              )
            : scrollableTab(
                <View style={{ paddingVertical: theme.space('space.4') }}>
                  <GameShelves entries={libraryEntries} isPending={false} onPressGame={openGame} />
                </View>,
              )
        : null}

      {tab === 'reviews'
        ? scrollableTab(
            <EmptyReviews listUnavailable={reviews.listUnavailable} onDiscover={goDiscover} />,
          )
        : null}

      {tab === 'collections' ? (
        data.collections.status === 'loading' ? (
          scrollableTab(<LibrarySkeleton sections={2} />)
        ) : data.collections.status === 'empty' ? (
          scrollableTab(<EmptyCollections onCreate={createCollection} onDiscover={goDiscover} />)
        ) : data.collections.status === 'error' ? (
          scrollableTab(
            <ProfileErrorState
              title="Could not load collections"
              isOffline={!isOnline}
              onRetry={() => {
                void data.collections.refetch();
              }}
            />,
          )
        ) : (
          <FlatList
            data={data.collections.items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <CollectionCard collection={item} onPress={openCollection} />}
            {...listProps}
          />
        )
      ) : null}

      {tab === 'tier-lists' ? (
        data.tierLists.status === 'loading' ? (
          scrollableTab(<LibrarySkeleton sections={2} />)
        ) : data.tierLists.status === 'empty' ? (
          scrollableTab(<EmptyTierLists onCreate={createTierList} onDiscover={goDiscover} />)
        ) : data.tierLists.status === 'error' ? (
          scrollableTab(
            <ProfileErrorState
              title="Could not load tier lists"
              isOffline={!isOnline}
              onRetry={() => {
                void data.tierLists.refetch();
              }}
            />,
          )
        ) : (
          <FlatList
            data={data.tierLists.items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) =>
              listRow(<TierListCard tierList={item} onPress={openTierList} />)
            }
            {...listProps}
          />
        )
      ) : null}

      <EditProfileModal
        visible={editOpen}
        user={user}
        onClose={() => {
          setEditOpen(false);
        }}
      />
    </Screen>
  );
}
