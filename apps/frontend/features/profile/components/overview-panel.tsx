import type {
  AchievementResponse,
  ActivityItemResponse,
  CollectionResponse,
  PlayerArchetypeResponse,
  SimilarUserResponse,
  TierListResponse,
} from '@gmrlog/types';
import { Text, useTheme } from '@gmrlog/ui';
import { Pressable, View } from 'react-native';

import { SimilarUsersSection } from '../../discover/components/similar-users-section';
import { ActivityCard } from '../../home/components/activity-card';

import { AchievementsSection } from './achievements-section';
import { ArchetypesStrip } from './archetypes-strip';
import { CollectionCard } from './collection-card';
import { EmptyCollections } from './empty-collections';
import { EmptyTierLists } from './empty-tier-lists';
import { FriendsEntry } from './friends-entry';
import { TierListCard } from './tier-list-card';

export interface OverviewPanelProps {
  recentActivity: ActivityItemResponse[];
  recentCollections: CollectionResponse[];
  recentTierLists: TierListResponse[];
  awardedAchievements: AchievementResponse[];
  archetypes: PlayerArchetypeResponse[];
  friendCount: number;
  similarUsers: SimilarUserResponse[];
  similarUsersPending: boolean;
  onPressActivity?: (item: ActivityItemResponse) => void;
  onPressCollection: (id: string) => void;
  onPressTierList: (id: string) => void;
  onPressFriends: () => void;
  onPressSimilarUser: (userId: string) => void;
  onDiscover: () => void;
}

function SectionTitle({ title }: { title: string }) {
  const theme = useTheme();
  return (
    <Text
      role="title"
      color="color.text.primary"
      style={{
        paddingHorizontal: theme.space('space.4'),
        paddingTop: theme.space('space.4'),
        paddingBottom: theme.space('space.2'),
      }}
    >
      {title}
    </Text>
  );
}

export function OverviewPanel({
  recentActivity,
  recentCollections,
  recentTierLists,
  awardedAchievements,
  archetypes,
  friendCount,
  similarUsers,
  similarUsersPending,
  onPressActivity,
  onPressCollection,
  onPressTierList,
  onPressFriends,
  onPressSimilarUser,
  onDiscover,
}: OverviewPanelProps) {
  const theme = useTheme();

  return (
    <View style={{ paddingBottom: theme.space('space.8') }}>
      <ArchetypesStrip archetypes={archetypes} />
      <FriendsEntry friendCount={friendCount} onPress={onPressFriends} />
      <AchievementsSection achievements={awardedAchievements} />
      <SimilarUsersSection
        items={similarUsers}
        isPending={similarUsersPending}
        onPressUser={onPressSimilarUser}
      />

      <SectionTitle title="Recent activity" />
      {recentActivity.length === 0 ? (
        <View
          style={{
            paddingHorizontal: theme.space('space.4'),
            paddingBottom: theme.space('space.2'),
          }}
        >
          <Text role="body" color="color.text.secondary">
            No recent activity yet. Your digital home fills as you play and share.
          </Text>
        </View>
      ) : (
        recentActivity.map((item) =>
          onPressActivity ? (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel="Open activity"
              onPress={() => {
                onPressActivity(item);
              }}
            >
              <ActivityCard item={item} />
            </Pressable>
          ) : (
            <ActivityCard key={item.id} item={item} />
          ),
        )
      )}

      <SectionTitle title="Recent reviews" />
      <View
        style={{ paddingHorizontal: theme.space('space.4'), paddingBottom: theme.space('space.2') }}
      >
        <Text role="body" color="color.text.secondary">
          Review history on Profile waits for an own-reviews index. Open individual reviews from
          activity or search for now.
        </Text>
      </View>

      <SectionTitle title="Recent collections" />
      {recentCollections.length === 0 ? (
        <EmptyCollections onDiscover={onDiscover} />
      ) : (
        recentCollections.map((collection) => (
          <CollectionCard key={collection.id} collection={collection} onPress={onPressCollection} />
        ))
      )}

      <SectionTitle title="Recent tier lists" />
      {recentTierLists.length === 0 ? (
        <EmptyTierLists onDiscover={onDiscover} />
      ) : (
        recentTierLists.map((tierList) => (
          <TierListCard key={tierList.id} tierList={tierList} onPress={onPressTierList} />
        ))
      )}
    </View>
  );
}
