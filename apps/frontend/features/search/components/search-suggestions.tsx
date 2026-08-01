import type { SearchHit } from '@gmrlog/types';
import { Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import type { SearchSuggestionGroup } from '../hooks/search-facets-model';

import { SearchResultCard } from './search-result-card';

export interface SearchSuggestionsProps {
  groups: readonly SearchSuggestionGroup[];
  onPressHit: (hit: SearchHit) => void;
  onSeeAll: (facet: SearchSuggestionGroup['facet']) => void;
}

/**
 * Grouped instant suggestions, shown while a query is still being typed.
 *
 * A flat list of ten mixed hits tells you nothing about the shape of what you
 * found. "3 games · 2 players" tells you whether to keep typing or switch tabs,
 * which is the actual decision at this moment.
 */
function SearchSuggestionsComponent({ groups, onPressHit, onSeeAll }: SearchSuggestionsProps) {
  const theme = useTheme();

  return (
    <View style={{ paddingBottom: theme.space('space.6') }}>
      {groups.map((group) => (
        <View key={group.facet}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.space('space.3'),
              paddingHorizontal: theme.space('space.4'),
              paddingTop: theme.space('space.4'),
              paddingBottom: theme.space('space.2'),
            }}
          >
            <Text
              role="title"
              color="color.text.primary"
              accessibilityRole="header"
              style={{ flex: 1 }}
            >
              {group.label}
            </Text>
            {group.overflow > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`See all ${group.label.toLowerCase()} results`}
                onPress={() => {
                  onSeeAll(group.facet);
                }}
                hitSlop={8}
                style={{ minHeight: theme.space('space.10'), justifyContent: 'center' }}
              >
                <Text role="label" color="color.accent.default">
                  {`+${String(group.overflow)} more`}
                </Text>
              </Pressable>
            ) : null}
          </View>

          {group.hits.map((hit) => (
            <SearchResultCard
              key={`${hit.type}:${hit.id}`}
              hit={hit}
              onPress={() => {
                onPressHit(hit);
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

export const SearchSuggestions = memo(SearchSuggestionsComponent);
