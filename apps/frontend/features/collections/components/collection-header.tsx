import type { CollectionResponse } from '@gmrlog/types';
import {
  AspectBox,
  Badge,
  GradientScrim,
  HeroBackButton,
  MetricStrip,
  StatTile,
  Text,
  useTheme,
} from '@gmrlog/ui';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CachedImage } from '../../../src/assets/cached-image';
import { formatUpdatedAt, visibilityLabel } from '../hooks/collection-model';
import { collectionStats, resolveCollectionCover } from '../hooks/collection-view-model';

export interface CollectionHeaderProps {
  collection: CollectionResponse;
  onBack: () => void;
}

/**
 * Collection hero — cover artwork, identity, and the numbers that describe it.
 *
 * The cover falls back to the first entry with art, so a shelf with games in it
 * is never reduced to a grey band just because nobody uploaded a custom cover.
 */
export function CollectionHeader({ collection, onBack }: CollectionHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const cover = resolveCollectionCover(collection);
  const stats = collectionStats(collection);
  const updated = formatUpdatedAt(collection.updatedAt);

  return (
    <View style={{ backgroundColor: theme.color('color.background.primary') }}>
      <View>
        <AspectBox ratio="hero" radius="radius.none">
          {cover !== null ? (
            <CachedImage
              source={{ uri: cover }}
              priority="high"
              contentFit="cover"
              accessibilityIgnoresInvertColors
              // Decorative: the title below already names the collection.
              accessibilityElementsHidden
              style={{ width: '100%', height: '100%' }}
            />
          ) : null}
          <GradientScrim direction="to-top" intensity={0.9} />
        </AspectBox>
        <HeroBackButton topInset={insets.top} onPress={onBack} />
      </View>

      <View
        style={{
          paddingHorizontal: theme.space('space.4'),
          paddingVertical: theme.space('space.4'),
          gap: theme.space('space.3'),
          borderBottomWidth: 1,
          borderBottomColor: theme.color('color.border.default'),
        }}
      >
        <View style={{ flexDirection: 'row', gap: theme.space('space.2'), alignItems: 'center' }}>
          <Text role="heading" style={{ flex: 1 }} numberOfLines={2} accessibilityRole="header">
            {collection.title}
          </Text>
          <Badge tone="neutral">{visibilityLabel(collection.visibility)}</Badge>
        </View>

        {collection.description !== null && collection.description.length > 0 ? (
          <Text role="body" color="color.text.secondary">
            {collection.description}
          </Text>
        ) : null}

        <MetricStrip accessibilityLabel="Collection totals">
          <StatTile value={String(stats.gameCount)} label="Games" />
          {stats.followerCount > 0 ? (
            <StatTile value={String(stats.followerCount)} label="Followers" />
          ) : null}
          {stats.withNotes > 0 ? (
            <StatTile value={String(stats.withNotes)} label="With notes" />
          ) : null}
        </MetricStrip>

        <Text role="meta" color="color.text.tertiary">
          {`Curated by ${collection.owner.displayName}${updated ? ` · Updated ${updated}` : ''}`}
        </Text>
      </View>
    </View>
  );
}
