import type { CollectionResponse } from '@gmrlog/types';
import { Badge, Text, useTheme } from '@gmrlog/ui';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatUpdatedAt, visibilityLabel } from '../hooks/collection-model';

export interface CollectionHeaderProps {
  collection: CollectionResponse;
  onBack: () => void;
}

export function CollectionHeader({ collection, onBack }: CollectionHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const hit = theme.space('space.12');

  return (
    <View style={{ backgroundColor: theme.color('color.background.primary') }}>
      <View
        accessibilityLabel="Cover placeholder"
        style={{
          height: theme.space('space.24'),
          backgroundColor: theme.color('color.surface.secondary'),
          paddingTop: insets.top,
          paddingHorizontal: theme.space('space.4'),
          paddingBottom: theme.space('space.3'),
          justifyContent: 'flex-end',
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={onBack}
          style={{ minHeight: hit, justifyContent: 'center', alignSelf: 'flex-start' }}
        >
          <Text role="label" color="color.interactive.primary">
            Back
          </Text>
        </Pressable>
      </View>
      <View
        style={{
          paddingHorizontal: theme.space('space.4'),
          paddingVertical: theme.space('space.4'),
          gap: theme.space('space.2'),
          borderBottomWidth: 1,
          borderBottomColor: theme.color('color.border.default'),
        }}
      >
        <View style={{ flexDirection: 'row', gap: theme.space('space.2'), alignItems: 'center' }}>
          <Text role="heading" style={{ flex: 1 }} numberOfLines={2}>
            {collection.title}
          </Text>
          <Badge tone="neutral">{visibilityLabel(collection.visibility)}</Badge>
        </View>
        <Text role="meta" color="color.text.tertiary">
          {String(collection.entries.length)} games · Updated{' '}
          {formatUpdatedAt(collection.updatedAt)}
        </Text>
      </View>
    </View>
  );
}
