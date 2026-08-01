import { Chip, Skeleton, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { ScrollView, View } from 'react-native';

export interface TrendingSearchesProps {
  terms: readonly string[];
  isPending: boolean;
  onSelect: (term: string) => void;
}

/**
 * Terms worth trying before you have typed anything.
 *
 * These are trending *games*, not trending *queries* — the backend has no
 * query-frequency endpoint and D3.28 does not add one. The section header calls
 * them "Trending on GMRLOG" so the claim matches the data.
 */
function TrendingSearchesComponent({ terms, isPending, onSelect }: TrendingSearchesProps) {
  const theme = useTheme();

  if (isPending && terms.length === 0) {
    return (
      <View
        style={{
          flexDirection: 'row',
          gap: theme.space('space.2'),
          paddingHorizontal: theme.space('space.4'),
        }}
      >
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton
            key={`trending-skeleton-${String(index)}`}
            shape="rect"
            width={theme.space('space.20')}
            height={theme.space('space.10')}
          />
        ))}
      </View>
    );
  }

  if (terms.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        paddingHorizontal: theme.space('space.4'),
        gap: theme.space('space.2'),
        paddingBottom: theme.space('space.2'),
      }}
    >
      {terms.map((term) => (
        <Chip
          key={term}
          accessibilityLabel={`Search for ${term}`}
          onPress={() => {
            onSelect(term);
          }}
          style={{ minHeight: theme.space('space.10'), justifyContent: 'center' }}
        >
          {term}
        </Chip>
      ))}
    </ScrollView>
  );
}

export const TrendingSearches = memo(TrendingSearchesComponent);
