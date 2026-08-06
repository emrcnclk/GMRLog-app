import { Chip, SCREEN_GUTTER, useTheme } from '@gmrlog/ui';
import { ScrollView } from 'react-native';

import type { DiscoverGenreChip } from '../hooks/discover-sections-model';

export interface GenreChipsRowProps {
  genres: readonly DiscoverGenreChip[];
  onSelectGenre: (genre: DiscoverGenreChip) => void;
}

/**
 * Genre pills (`SCREEN_REDESIGNS.md` §7) — the same bleeding-scroll shape
 * `Rail` uses, composed locally rather than through `Rail` itself: `Rail`
 * always renders a `SectionKicker` header above its scroller, and this row
 * sits directly under the search field with no title of its own.
 */
export function GenreChipsRow({ genres, onSelectGenre }: GenreChipsRowProps) {
  const theme = useTheme();

  if (genres.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityLabel="Genres"
      contentContainerStyle={{
        paddingHorizontal: theme.space(SCREEN_GUTTER),
        paddingBottom: theme.space('space.4'),
        gap: theme.space('space.2'),
      }}
    >
      {genres.map((genre) => (
        <Chip
          key={genre.id}
          onPress={() => {
            onSelectGenre(genre);
          }}
        >
          {genre.name}
        </Chip>
      ))}
    </ScrollView>
  );
}
