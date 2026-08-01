import type { CollectionResponse } from '@gmrlog/types';
import { Badge, Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { formatUpdatedAt, visibilityLabel } from '../hooks/collection-model';

export interface CollectionCardProps {
  collection: CollectionResponse;
  onPress: (collectionId: string) => void;
}

function CollectionCardComponent({ collection, onPress }: CollectionCardProps) {
  const theme = useTheme();
  const entryCount = collection.entries.length;
  const updated = formatUpdatedAt(collection.updatedAt);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${collection.title}, ${visibilityLabel(collection.visibility)}, ${String(entryCount)} games`}
      onPress={() => {
        onPress(collection.id);
      }}
      style={{
        paddingHorizontal: theme.space('space.4'),
        paddingVertical: theme.space('space.3'),
        gap: theme.space('space.2'),
        borderBottomWidth: 1,
        borderBottomColor: theme.color('color.border.default'),
        backgroundColor: theme.color('color.background.primary'),
        minHeight: theme.space('space.16'),
      }}
    >
      <View
        accessibilityLabel="Cover placeholder"
        style={{
          height: theme.space('space.16'),
          borderRadius: theme.radius('radius.md'),
          backgroundColor: theme.color('color.surface.secondary'),
          justifyContent: 'flex-end',
          padding: theme.space('space.3'),
        }}
      >
        <Text role="caption" color="color.text.tertiary">
          Cover
        </Text>
      </View>

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
        <Badge tone="neutral">{visibilityLabel(collection.visibility)}</Badge>
      </View>

      {collection.description ? (
        <Text role="body" color="color.text.secondary" numberOfLines={2}>
          {collection.description}
        </Text>
      ) : null}

      <Text role="meta" color="color.text.tertiary">
        {String(entryCount)} {entryCount === 1 ? 'game' : 'games'}
        {updated ? ` · Updated ${updated}` : ''}
      </Text>
    </Pressable>
  );
}

export const CollectionCard = memo(CollectionCardComponent);
