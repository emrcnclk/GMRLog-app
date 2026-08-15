import { Chip, Icon, IconButton, SCREEN_GUTTER, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { ScrollView, View } from 'react-native';

import {
  COLLECTION_SORT_LABELS,
  COLLECTION_SORT_ORDER,
  type CollectionLayout,
  type CollectionSort,
} from '../hooks/collection-view-model';

export interface CollectionToolbarProps {
  sort: CollectionSort;
  onChangeSort: (sort: CollectionSort) => void;
  layout: CollectionLayout;
  onChangeLayout: (layout: CollectionLayout) => void;
}

/**
 * Sort and layout controls for a shelf of collections.
 *
 * The layout toggle is a single button that shows the layout it will switch
 * *to*, not the one you are in — a two-state control that describes its own
 * action is read correctly far more often than one that describes state.
 * `accessibilityState.checked` still carries the current mode for screen
 * readers, where the visual metaphor is unavailable.
 */
function CollectionToolbarComponent({
  sort,
  onChangeSort,
  layout,
  onChangeLayout,
}: CollectionToolbarProps) {
  const theme = useTheme();
  const nextLayout: CollectionLayout = layout === 'grid' ? 'list' : 'grid';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space('space.2'),
        paddingVertical: theme.space('space.2'),
        borderBottomWidth: 1,
        borderBottomColor: theme.color('color.border.default'),
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: theme.space(SCREEN_GUTTER),
          gap: theme.space('space.2'),
        }}
        style={{ flex: 1 }}
      >
        {COLLECTION_SORT_ORDER.map((option) => (
          <Chip
            key={option}
            selected={sort === option}
            accessibilityLabel={`Sort by ${COLLECTION_SORT_LABELS[option]}`}
            accessibilityState={{ selected: sort === option }}
            onPress={() => {
              onChangeSort(option);
            }}
            style={{ minHeight: theme.space('space.10'), justifyContent: 'center' }}
          >
            {COLLECTION_SORT_LABELS[option]}
          </Chip>
        ))}
      </ScrollView>

      <View style={{ paddingRight: theme.space(SCREEN_GUTTER) }}>
        <IconButton
          accessibilityLabel={nextLayout === 'grid' ? 'Switch to grid view' : 'Switch to list view'}
          accessibilityState={{ checked: layout === 'grid' }}
          aria-checked={layout === 'grid'}
          size="lg"
          onPress={() => {
            onChangeLayout(nextLayout);
          }}
        >
          <Icon
            name={nextLayout === 'grid' ? 'layout-grid' : 'list'}
            decorative
            size={20}
            color="color.text.primary"
          />
        </IconButton>
      </View>
    </View>
  );
}

export const CollectionToolbar = memo(CollectionToolbarComponent);
