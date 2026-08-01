import type { LibraryEntryResponse } from '@gmrlog/types';
import { Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { FlatList, Pressable, View } from 'react-native';

import { CachedImage } from '../../../src/assets/cached-image';

export interface LibrarySectionProps {
  title: string;
  entries: LibraryEntryResponse[];
  onPressGame: (gameId: string) => void;
}

function LibraryEntryRowComponent({
  entry,
  onPressGame,
}: {
  entry: LibraryEntryResponse;
  onPressGame: (gameId: string) => void;
}) {
  const theme = useTheme();
  const coverSize = theme.space('space.16');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${entry.game.title}, open game`}
      onPress={() => {
        onPressGame(entry.gameId);
      }}
      style={{
        width: theme.space('space.20') + theme.space('space.4'),
        gap: theme.space('space.2'),
      }}
    >
      <View
        style={{
          width: coverSize,
          height: coverSize,
          borderRadius: theme.radius('radius.md'),
          backgroundColor: theme.color('color.surface.secondary'),
          overflow: 'hidden',
        }}
      >
        {entry.game.coverUrl ? (
          <CachedImage
            source={{ uri: entry.game.coverUrl }}
            style={{ width: coverSize, height: coverSize }}
            accessibilityLabel={`${entry.game.title} cover`}
          />
        ) : null}
      </View>
      <Text role="caption" color="color.text.primary" numberOfLines={2}>
        {entry.game.title}
      </Text>
    </Pressable>
  );
}

const LibraryEntryRow = memo(LibraryEntryRowComponent);

function LibrarySectionComponent({ title, entries, onPressGame }: LibrarySectionProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        gap: theme.space('space.3'),
        paddingVertical: theme.space('space.3'),
        borderBottomWidth: 1,
        borderBottomColor: theme.color('color.border.default'),
      }}
    >
      <Text
        role="title"
        color="color.text.primary"
        style={{ paddingHorizontal: theme.space('space.4') }}
      >
        {title}
      </Text>
      <FlatList
        horizontal
        data={entries}
        keyExtractor={(item) => `${item.gameId}:${item.status}`}
        renderItem={({ item }) => <LibraryEntryRow entry={item} onPressGame={onPressGame} />}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: theme.space('space.4'),
          gap: theme.space('space.3'),
        }}
        initialNumToRender={8}
        windowSize={5}
        removeClippedSubviews
      />
    </View>
  );
}

export const LibrarySection = memo(LibrarySectionComponent);
