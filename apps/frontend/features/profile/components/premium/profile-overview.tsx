import type {
  AchievementResponse,
  ActivityItemResponse,
  CollectionResponse,
  LibraryEntryResponse,
  PlayerArchetypeResponse,
  StatisticsHistoryResponse,
  UserStatisticsResponse,
} from '@gmrlog/types';
import { AspectBox, EmptyState, Rail, Text, useTheme } from '@gmrlog/ui';
import { memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { TimelineCard } from '../../../../shared/timeline/timeline-card';
import {
  activityToTimelineCard,
  timelineObjectRoute,
} from '../../../../shared/timeline/timeline-model';
import { CachedImage } from '../../../../src/assets/cached-image';
import {
  resolveWidgetLayout,
  type ProfileCustomization,
  type ProfileWidgetId,
} from '../../hooks/profile-customization-model';
import { buildGameShelves } from '../../hooks/profile-insights-model';

import { AchievementShowcase } from './achievement-showcase';
import { ArchetypeSection } from './archetype-card';
import { ActivityHeatmapSection, GamingInsights } from './gaming-insights';

export interface ProfileOverviewProps {
  customization: ProfileCustomization;
  statistics: UserStatisticsResponse | null;
  history: StatisticsHistoryResponse | null;
  archetypes: readonly PlayerArchetypeResponse[];
  achievements: readonly AchievementResponse[];
  libraryEntries: readonly LibraryEntryResponse[];
  collections: readonly CollectionResponse[];
  recentActivity: readonly ActivityItemResponse[];
  isPending: boolean;
  onPressGame: (gameId: string) => void;
  onPressCollection: (collectionId: string) => void;
  onPressRoute: (route: string) => void;
  onPressUser: (userId: string) => void;
}

const COVER_TILE = 116;

/**
 * D3.27 Phase 2 — profile overview.
 *
 * Widgets render in the order the player configured (Phase 5), with pinned ones
 * first and hidden ones omitted. Each widget renders nothing at all when it has
 * no data, so the overview is never padded with empty shells.
 */
function ProfileOverviewComponent({
  customization,
  statistics,
  history,
  archetypes,
  achievements,
  libraryEntries,
  collections,
  recentActivity,
  isPending,
  onPressGame,
  onPressCollection,
  onPressRoute,
  onPressUser,
}: ProfileOverviewProps) {
  const theme = useTheme();
  const layout = useMemo(() => resolveWidgetLayout(customization), [customization]);
  const shelves = useMemo(() => buildGameShelves(libraryEntries), [libraryEntries]);

  const shelf = (key: string): LibraryEntryResponse[] =>
    shelves.find((entry) => entry.key === key)?.entries ?? [];

  const renderWidget = (id: ProfileWidgetId) => {
    switch (id) {
      case 'archetypes':
        return <ArchetypeSection archetypes={archetypes} isPending={isPending} />;

      case 'insights':
        return <GamingInsights statistics={statistics} />;

      case 'heatmap':
        return <ActivityHeatmapSection history={history} />;

      case 'achievements':
        return <AchievementShowcase achievements={achievements} isPending={isPending} />;

      case 'currently-playing':
        return (
          <GameRail
            title="Currently playing"
            entries={shelf('playing')}
            onPressGame={onPressGame}
          />
        );

      case 'recently-finished':
        return (
          <GameRail
            title="Recently finished"
            entries={shelf('completed')}
            onPressGame={onPressGame}
          />
        );

      case 'wishlist':
        return <GameRail title="Wishlist" entries={shelf('wishlist')} onPressGame={onPressGame} />;

      case 'backlog':
        return <GameRail title="Backlog" entries={shelf('backlog')} onPressGame={onPressGame} />;

      case 'collections':
        if (collections.length === 0) {
          return null;
        }
        return (
          <Rail title="Collections" subtitle={`${String(collections.length)} curated`}>
            {collections.slice(0, 12).map((collection) => (
              <Pressable
                key={collection.id}
                accessibilityRole="button"
                accessibilityLabel={`Open collection ${collection.title}`}
                onPress={() => {
                  onPressCollection(collection.id);
                }}
                style={({ pressed }) => ({
                  width: 180,
                  padding: theme.space('space.3'),
                  borderRadius: theme.radius('radius.lg'),
                  backgroundColor: theme.color('color.surface.secondary'),
                  borderWidth: 1,
                  borderColor: theme.color('color.border.default'),
                  gap: theme.space('space.1'),
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text role="label" numberOfLines={2}>
                  {collection.title}
                </Text>
                <Text role="meta" color="color.text.tertiary">
                  {collection.visibility}
                </Text>
              </Pressable>
            ))}
          </Rail>
        );

      case 'activity':
        if (recentActivity.length === 0) {
          return null;
        }
        return (
          <View style={{ gap: theme.space('space.2') }}>
            <View style={{ paddingHorizontal: theme.space('space.4') }}>
              <Text role="title">Recent activity</Text>
            </View>
            {recentActivity.slice(0, 8).map((item) => {
              const model = activityToTimelineCard(item);
              const route = timelineObjectRoute(model.objectRef);
              return (
                <TimelineCard
                  key={item.id}
                  model={model}
                  onPress={
                    route === null
                      ? undefined
                      : () => {
                          onPressRoute(route);
                        }
                  }
                  onPressActor={onPressUser}
                />
              );
            })}
          </View>
        );

      default: {
        const _exhaustive: never = id;
        return _exhaustive;
      }
    }
  };

  const widgets = layout
    .map((id) => ({ id, node: renderWidget(id) }))
    .filter((widget) => widget.node !== null);

  if (widgets.length === 0) {
    return (
      <EmptyState
        title="Your profile is just getting started"
        description="Log a game, write a review, or build a collection — this space fills in as you play."
      />
    );
  }

  return (
    <View style={{ gap: theme.space('space.6'), paddingVertical: theme.space('space.4') }}>
      {widgets.map((widget) => (
        <View key={widget.id}>{widget.node}</View>
      ))}
    </View>
  );
}

/** Shared cover rail used by every library-backed widget above. */
function GameRail({
  title,
  entries,
  onPressGame,
}: {
  title: string;
  entries: readonly LibraryEntryResponse[];
  onPressGame: (gameId: string) => void;
}) {
  const theme = useTheme();

  if (entries.length === 0) {
    return null;
  }

  return (
    <Rail
      title={title}
      subtitle={`${String(entries.length)} ${entries.length === 1 ? 'game' : 'games'}`}
      gap={theme.space('space.2')}
    >
      {entries.slice(0, 20).map((entry) => (
        <Pressable
          key={entry.gameId}
          accessibilityRole="button"
          accessibilityLabel={`Open ${entry.game.title}`}
          onPress={() => {
            onPressGame(entry.gameId);
          }}
          style={({ pressed }) => ({
            width: COVER_TILE,
            gap: theme.space('space.1'),
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <AspectBox ratio="cover">
            {entry.game.coverUrl !== null ? (
              <CachedImage
                source={{ uri: entry.game.coverUrl }}
                priority="low"
                contentFit="cover"
                accessibilityIgnoresInvertColors
                style={{ width: '100%', height: '100%' }}
              />
            ) : null}
          </AspectBox>
          <Text role="meta" numberOfLines={2}>
            {entry.game.title}
          </Text>
        </Pressable>
      ))}
    </Rail>
  );
}

export const ProfileOverview = memo(ProfileOverviewComponent);
