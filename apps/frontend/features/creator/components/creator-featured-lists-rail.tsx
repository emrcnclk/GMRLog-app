import type { CollectionResponse, CreatorProfileResponse } from '@gmrlog/types';
import { EmptyState, HIDDEN_FROM_ASSISTIVE_TECH, Rail, Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { CachedImage } from '../../../src/assets/cached-image';
import {
  collectionMosaicCovers,
  collectionStats,
} from '../../collections/hooks/collection-view-model';
import { featuredLists } from '../hooks/creator-hub-model';

export interface CreatorFeaturedListsRailProps {
  creator: CreatorProfileResponse | null;
  isPending: boolean;
  onPressList: (collectionId: string) => void;
}

/** §25's "bleeding rail of 168px cards". */
const CARD_WIDTH = 168;
const MOSAIC_HEIGHT = 72;

/**
 * §25's "Featured lists" — the creator's real public `Collection`s
 * (`CreatorProfileResponse.collections`, already gated by eligibility and
 * capped at 20 server-side). A normal empty state, not a gap: the section is
 * fully wired, it just has nothing in it for this creator yet.
 */
export function CreatorFeaturedListsRail({
  creator,
  isPending,
  onPressList,
}: CreatorFeaturedListsRailProps) {
  if (isPending && creator === null) {
    return null;
  }

  const lists = featuredLists(creator);

  if (lists.length === 0) {
    return (
      <Rail
        title="Featured lists"
        isEmpty
        emptyState={
          <EmptyState
            title="No featured lists yet"
            description="Public collections this creator shares will appear here."
          />
        }
      >
        {null}
      </Rail>
    );
  }

  return (
    <Rail title="Featured lists" counter={String(lists.length)}>
      {lists.map((list) => (
        <FeaturedListCard key={list.id} collection={list} onPress={onPressList} />
      ))}
    </Rail>
  );
}

interface FeaturedListCardProps {
  collection: CollectionResponse;
  onPress: (collectionId: string) => void;
}

function FeaturedListCardComponent({ collection, onPress }: FeaturedListCardProps) {
  const theme = useTheme();
  const covers = collectionMosaicCovers(collection, 3);
  const stats = collectionStats(collection);
  const gameLabel = `${String(stats.gameCount)} ${stats.gameCount === 1 ? 'game' : 'games'}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${collection.title}, ${gameLabel}`}
      onPress={() => {
        onPress(collection.id);
      }}
      style={{
        width: CARD_WIDTH,
        borderRadius: theme.radius('radius.lg'),
        borderWidth: 1,
        borderColor: theme.color('color.border.default'),
        backgroundColor: theme.color('color.surface.card'),
        overflow: 'hidden',
      }}
    >
      <View
        {...HIDDEN_FROM_ASSISTIVE_TECH}
        style={{ height: MOSAIC_HEIGHT, flexDirection: 'row', gap: 2 }}
      >
        {[0, 1, 2].map((index) => {
          const url = covers[index] ?? null;
          return (
            <View
              key={index}
              style={{ flex: 1, backgroundColor: theme.color('color.surface.secondary') }}
            >
              {url === null ? null : (
                <CachedImage
                  source={{ uri: url }}
                  priority="low"
                  contentFit="cover"
                  accessibilityIgnoresInvertColors
                  style={{ flex: 1 }}
                />
              )}
            </View>
          );
        })}
      </View>

      <View style={{ padding: theme.space('space.3'), gap: theme.space('space.1') }}>
        <Text role="label" numberOfLines={2}>
          {collection.title}
        </Text>
        <Text role="meta" color="color.text.tertiary">
          {gameLabel}
        </Text>
      </View>
    </Pressable>
  );
}

const FeaturedListCard = memo(FeaturedListCardComponent);
