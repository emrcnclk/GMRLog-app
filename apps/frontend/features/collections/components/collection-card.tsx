import type { CollectionResponse } from '@gmrlog/types';
import {
  ASPECT,
  AspectBox,
  Badge,
  HIDDEN_FROM_ASSISTIVE_TECH,
  Text,
  pressableMotionStyle,
  useReduceMotion,
  useTheme,
} from '@gmrlog/ui';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { CachedImage } from '../../../src/assets/cached-image';
import { formatUpdatedAt, visibilityLabel } from '../hooks/collection-model';
import { collectionMosaicCovers, collectionStats } from '../hooks/collection-view-model';

export interface CollectionCardProps {
  collection: CollectionResponse;
  onPress: (collectionId: string) => void;
  /** `grid` renders a square tile; `list` a full-width row. */
  layout?: 'grid' | 'list';
  /** Tile width in grid layout — supplied by the list so columns line up. */
  width?: number;
}

/**
 * A collection, shown as the thing it collects.
 *
 * This card used to render a grey rectangle captioned "Cover" while
 * `CollectionResponse` carried `coverUrl`, `bannerUrl`, and an entry list full
 * of game art. Now it builds a mosaic from the first four entry covers, which
 * makes one shelf distinguishable from another at a glance — the whole job of a
 * collection card.
 */
function CollectionCardComponent({
  collection,
  onPress,
  layout = 'list',
  width,
}: CollectionCardProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const stats = collectionStats(collection);
  const updated = formatUpdatedAt(collection.updatedAt);
  const covers = collectionMosaicCovers(collection);
  const isGrid = layout === 'grid';

  const meta = `${String(stats.gameCount)} ${stats.gameCount === 1 ? 'game' : 'games'}${
    stats.followerCount > 0 ? ` · ${String(stats.followerCount)} following` : ''
  }${updated ? ` · Updated ${updated}` : ''}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${collection.title}, ${visibilityLabel(collection.visibility)}, ${meta}`}
      onPress={() => {
        onPress(collection.id);
      }}
      style={({ pressed }) => [
        isGrid
          ? { width, gap: theme.space('space.2') }
          : {
              paddingHorizontal: theme.space('space.4'),
              paddingVertical: theme.space('space.3'),
              gap: theme.space('space.2'),
              borderBottomWidth: 1,
              borderBottomColor: theme.color('color.border.default'),
              backgroundColor: theme.color('color.background.primary'),
            },
        pressableMotionStyle(pressed, reduceMotion),
      ]}
    >
      <CoverMosaic covers={covers} ratio={isGrid ? 'cover' : 'hero'} />

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: theme.space('space.2'),
        }}
      >
        <Text role="label" color="color.text.primary" numberOfLines={2} style={{ flex: 1 }}>
          {collection.title}
        </Text>
        {isGrid ? null : <Badge tone="neutral">{visibilityLabel(collection.visibility)}</Badge>}
      </View>

      {!isGrid && collection.description ? (
        <Text role="body" color="color.text.secondary" numberOfLines={2}>
          {collection.description}
        </Text>
      ) : null}

      <Text role="meta" color="color.text.tertiary" numberOfLines={1}>
        {meta}
      </Text>
    </Pressable>
  );
}

/**
 * Up to four covers as a tiled block.
 *
 * Decorative throughout: the card's own accessibility label already names the
 * collection and its size, so announcing four game covers underneath it would
 * be four stops of noise before the reader reaches anything useful.
 */
function CoverMosaic({ covers, ratio }: { covers: readonly string[]; ratio: 'cover' | 'hero' }) {
  const theme = useTheme();

  return (
    <View
      {...HIDDEN_FROM_ASSISTIVE_TECH}
      style={{
        borderRadius: theme.radius('radius.md'),
        overflow: 'hidden',
        backgroundColor: theme.color('color.surface.secondary'),
        borderWidth: 1,
        borderColor: theme.color('color.border.default'),
      }}
    >
      <AspectBox ratio={ratio} radius="radius.none">
        {covers.length === 0 ? null : (
          <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap' }}>
            {covers.map((url, index) => (
              <CachedImage
                key={`${url}-${String(index)}`}
                source={{ uri: url }}
                priority="low"
                contentFit="cover"
                accessibilityIgnoresInvertColors
                style={{
                  // One cover fills the block; two or more split it into halves.
                  width: covers.length === 1 ? '100%' : '50%',
                  height: covers.length <= 2 ? '100%' : '50%',
                }}
              />
            ))}
          </View>
        )}
      </AspectBox>
    </View>
  );
}

export { ASPECT };
export const CollectionCard = memo(CollectionCardComponent);
