import {
  Button,
  Chip,
  Loading,
  SCREEN_GUTTER,
  Screen,
  ScreenTitle,
  Section,
  SectionKicker,
  useTheme,
} from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, View } from 'react-native';

import { useConnectivityStore } from '../../../src/state/stores';
import { ActiveNowRail } from '../components/active-now-rail';
import { CommunityCard } from '../components/community-card';
import { CommunityErrorState } from '../components/community-error-state';
import { CommunitySkeleton } from '../components/community-skeleton';
import { EmptyCommunities } from '../components/empty-communities';
import {
  CIRCLE_KIND_FILTERS,
  activeNowCommunities,
  communityDirectoryMeta,
  splitCommunityDirectory,
  type CircleKindFilterValue,
} from '../hooks/community-directory-model';
import { useCommunities } from '../hooks/use-communities';

/**
 * `SCREEN_REDESIGNS_2.md` §13 — Circles (directory). `GET /communities`.
 *
 * The title block scrolls with the list rather than sitting in a bar above it,
 * so `ScreenTitle` replaces `ScreenHeader` — the same swap 3.1–3.4 made, and the
 * reason `NavHeader` stays reserved for pushed detail screens.
 *
 * **All four of §13's pieces are built.** The filter pills and the "Active now"
 * rail were withheld on 3b.1 because `CommunityResponse` carried neither a
 * circle `kind` nor an activity signal; both landed additively in 3b.1e
 * (`BACKEND_CHANGES.md` §6) — the filter is a server-side `kind` query param
 * (§13's kind applies across a whole paginated page, so filtering client-side
 * over one loaded page would have silently hidden real rows), and the rail is
 * a highlight over the same page, the same relationship "Your circles" and
 * "Suggested" already have to it.
 */
export function CommunitiesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const [kindFilter, setKindFilter] = useState<CircleKindFilterValue>('all');
  const list = useCommunities(kindFilter === 'all' ? undefined : kindFilter);

  const openCreate = useCallback(() => {
    router.push('/(app)/communities/create');
  }, [router]);

  const openDiscover = useCallback(() => {
    router.push('/(app)/(tabs)/discover/communities');
  }, [router]);

  const openCommunity = useCallback(
    (id: string) => {
      router.push(`/(app)/community/${id}`);
    },
    [router],
  );

  const sections = useMemo(() => splitCommunityDirectory(list.items), [list.items]);
  const active = useMemo(() => activeNowCommunities(list.items), [list.items]);

  // The scroll container owns the gutter (below), so the title block must not
  // add its own — `ScreenTitle` carries `SCREEN_GUTTER` by default and two
  // paddings stack into a 40px inset. This is the check 3.4 and 3.9 shipped past.
  const title = (
    <ScreenTitle
      style={{ paddingHorizontal: 0 }}
      title="Circles"
      meta={list.status === 'ready' ? communityDirectoryMeta(list.items) : undefined}
      backLabel="← Back"
      onPressBack={() => {
        router.back();
      }}
      trailing={
        <Button
          variant="ghost"
          size="sm"
          accessibilityLabel="Create community"
          onPress={openCreate}
        >
          Create
        </Button>
      }
    />
  );

  // §13's filter pills. A row, not a `Rail` — pills are chrome for the whole
  // screen, not a shelf of content, so they stay inside the ambient gutter
  // rather than bleeding.
  const filterPills = (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', gap: theme.space('space.2') }}>
        {CIRCLE_KIND_FILTERS.map((filter) => (
          <Chip
            key={filter.value}
            selected={kindFilter === filter.value}
            accessibilityLabel={`Filter: ${filter.label}`}
            onPress={() => {
              setKindFilter(filter.value);
            }}
          >
            {filter.label}
          </Chip>
        ))}
      </View>
    </ScrollView>
  );

  // The three non-list states have no scroll container to inherit the gutter
  // from, so they carry it themselves — one inset either way, never two.
  const gutteredTitle = (
    <View style={{ paddingHorizontal: theme.space(SCREEN_GUTTER), gap: theme.space('space.3') }}>
      {title}
      {filterPills}
    </View>
  );

  return (
    /* `edges` drops the left/right inset: the gutter is `SCREEN_GUTTER`, applied
       once by whatever scrolls. Keeping `Screen`'s own 16 as well put every
       element at x=36 — the stack 3.4 and 3.9 shipped, caught here by measuring
       the gutter before anything else. */
    <Screen edges={[]}>
      {list.status === 'loading' ? (
        <>
          {gutteredTitle}
          <CommunitySkeleton />
        </>
      ) : null}

      {list.status === 'error' ? (
        <>
          {gutteredTitle}
          <CommunityErrorState
            isOffline={!isOnline}
            onRetry={() => {
              void list.refetch();
            }}
          />
        </>
      ) : null}

      {list.status === 'empty' ? (
        <>
          {gutteredTitle}
          <EmptyCommunities onCreate={openCreate} onDiscover={openDiscover} />
        </>
      ) : null}

      {list.status === 'ready' ? (
        /* One list, not two: the joined section is bounded by how many circles a
           player has actually joined, so it rides in the header while the open
           directory — the list that grows — keeps its virtualization. */
        <FlatList
          data={sections.suggested}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CommunityCard community={item} onPress={openCommunity} />}
          ItemSeparatorComponent={() => <View style={{ height: theme.space('space.3') }} />}
          ListHeaderComponent={
            <View style={{ gap: theme.space('space.6'), paddingBottom: theme.space('space.3') }}>
              {title}
              {filterPills}
              {sections.joined.length === 0 ? null : (
                <Section title="Your circles" counter={String(sections.joined.length)}>
                  <View style={{ gap: theme.space('space.3') }}>
                    {sections.joined.map((item) => (
                      <CommunityCard key={item.id} community={item} onPress={openCommunity} />
                    ))}
                  </View>
                </Section>
              )}
              {/* §13's second section. `Rail` bleeds against its own gutter, but this
                  header already sits inside the `FlatList`'s `paddingHorizontal` — the
                  negative margin cancels that ambient padding so the rail can bleed
                  the way it does everywhere else it is used. */}
              {active.length === 0 ? null : (
                <View style={{ marginHorizontal: -theme.space(SCREEN_GUTTER) }}>
                  <ActiveNowRail communities={active} onPress={openCommunity} />
                </View>
              )}
              {/* The kicker alone, not a `Section`: this section's children are
                  the `FlatList`'s own rows, so wrapping them is not possible
                  without giving up virtualization on the list that grows. */}
              {sections.suggested.length === 0 ? null : (
                <SectionKicker title="Suggested" counter={String(sections.suggested.length)} />
              )}
            </View>
          }
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
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: theme.space(SCREEN_GUTTER),
            paddingBottom: theme.space('space.8'),
          }}
          // 3b.1a: the directory is paged now, so the list asks for the next
          // page instead of receiving every circle at once.
          onEndReached={list.loadMore}
          onEndReachedThreshold={0.6}
          ListFooterComponent={
            list.isFetchingNextPage ? (
              <View style={{ paddingVertical: theme.space('space.6') }}>
                <Loading label="Loading more circles" />
              </View>
            ) : null
          }
          accessibilityRole="list"
          initialNumToRender={10}
          windowSize={9}
          maxToRenderPerBatch={12}
          removeClippedSubviews
        />
      ) : null}
    </Screen>
  );
}
