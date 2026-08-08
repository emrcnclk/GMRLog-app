import {
  Button,
  SCREEN_GUTTER,
  Screen,
  ScreenTitle,
  Section,
  SectionKicker,
  useTheme,
} from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';

import { useConnectivityStore } from '../../../src/state/stores';
import { CommunityCard } from '../components/community-card';
import { CommunityErrorState } from '../components/community-error-state';
import { CommunitySkeleton } from '../components/community-skeleton';
import { EmptyCommunities } from '../components/empty-communities';
import {
  communityDirectoryMeta,
  splitCommunityDirectory,
} from '../hooks/community-directory-model';
import { useCommunities } from '../hooks/use-communities';

/**
 * `SCREEN_REDESIGNS_2.md` §13 — Circles (directory). `GET /communities`.
 *
 * The title block scrolls with the list rather than sitting in a bar above it,
 * so `ScreenTitle` replaces `ScreenHeader` — the same swap 3.1–3.4 made, and the
 * reason `NavHeader` stays reserved for pushed detail screens.
 *
 * **Two of §13's four pieces are not built, because no field feeds them.** The
 * filter pills need a circle *kind* (the prototype's All · Games · Board games ·
 * Cosplay · Live events) and `CommunityResponse` carries none; the "Active now"
 * rail needs an activity signal and `CommunityCounts` is members-only by its own
 * doc comment. Both are recorded as follow-ups on 3b.1 with the field each would
 * need. Rendering an empty rail, or pills that filter on nothing, would have
 * been worse than leaving the space to the two sections that are real.
 */
export function CommunitiesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const list = useCommunities();

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

  // The three non-list states have no scroll container to inherit the gutter
  // from, so they carry it themselves — one inset either way, never two.
  const gutteredTitle = (
    <View style={{ paddingHorizontal: theme.space(SCREEN_GUTTER) }}>{title}</View>
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
              {sections.joined.length === 0 ? null : (
                <Section title="Your circles" counter={String(sections.joined.length)}>
                  <View style={{ gap: theme.space('space.3') }}>
                    {sections.joined.map((item) => (
                      <CommunityCard key={item.id} community={item} onPress={openCommunity} />
                    ))}
                  </View>
                </Section>
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
