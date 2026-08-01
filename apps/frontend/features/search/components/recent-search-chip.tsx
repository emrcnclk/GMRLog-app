import { Chip, Text, useTheme } from '@gmrlog/ui';
import { Pressable, ScrollView, View } from 'react-native';

export interface RecentSearchChipProps {
  query: string;
  onPress: () => void;
  onRemove?: () => void;
}

export function RecentSearchChip({ query, onPress, onRemove }: RecentSearchChipProps) {
  const theme = useTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space('space.1') }}>
      <Chip
        accessibilityLabel={`Recent search ${query}`}
        onPress={onPress}
        style={{ minHeight: theme.space('space.10'), justifyContent: 'center' }}
      >
        {query}
      </Chip>
      {onRemove ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${query} from recent searches`}
          onPress={onRemove}
          hitSlop={8}
          style={{
            minWidth: theme.space('space.10'),
            minHeight: theme.space('space.10'),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text role="label" color="color.text.tertiary">
            Remove
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export interface RecentSearchesProps {
  items: string[];
  onSelect: (query: string) => void;
  onRemove: (query: string) => void;
  onClearAll?: () => void;
}

export function RecentSearches({ items, onSelect, onRemove, onClearAll }: RecentSearchesProps) {
  const theme = useTheme();

  if (items.length === 0) {
    return (
      <View style={{ padding: theme.space('space.6') }}>
        <Text role="body" color="color.text.secondary" style={{ textAlign: 'center' }}>
          Recent searches will appear here.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ gap: theme.space('space.2') }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingHorizontal: theme.space('space.4'),
        }}
      >
        {onClearAll ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear recent searches"
            onPress={onClearAll}
            hitSlop={8}
            style={{
              minHeight: theme.space('space.10'),
              justifyContent: 'center',
            }}
          >
            <Text role="label" color="color.text.secondary">
              Clear
            </Text>
          </Pressable>
        ) : null}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: theme.space('space.4'),
          gap: theme.space('space.2'),
          paddingBottom: theme.space('space.2'),
        }}
      >
        {items.map((item) => (
          <RecentSearchChip
            key={item}
            query={item}
            onPress={() => {
              onSelect(item);
            }}
            onRemove={() => {
              onRemove(item);
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
}
