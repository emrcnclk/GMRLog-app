import type { SearchGameHit } from '@gmrlog/types';
import { Button, EmptyState, Screen, Text, TextField, useTheme } from '@gmrlog/ui';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { normalizeSearchQuery } from '../../search/hooks/search-model';
import { useSearchResults } from '../../search/hooks/use-search';

export interface GamePickerSelection {
  gameId: string;
  title: string;
  slug: string;
}

export interface GamePickerProps {
  visible: boolean;
  excludedGameIds: ReadonlySet<string> | readonly string[];
  onClose: () => void;
  onSelect: (game: GamePickerSelection) => void;
}

function toExcludedSet(ids: ReadonlySet<string> | readonly string[]): Set<string> {
  if (ids instanceof Set) {
    return new Set<string>(Array.from(ids.values()));
  }
  return new Set<string>(ids);
}

/** Search existing games via GET /search — filters to game hits · blocks duplicates. */
export function GamePicker({ visible, excludedGameIds, onClose, onSelect }: GamePickerProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const normalized = normalizeSearchQuery(query);
  const search = useSearchResults(normalized);
  const excluded = useMemo(() => toExcludedSet(excludedGameIds), [excludedGameIds]);

  const games = useMemo(() => {
    return search.items.filter((hit): hit is SearchGameHit => hit.type === 'game');
  }, [search.items]);

  const onPick = useCallback(
    (hit: SearchGameHit) => {
      if (excluded.has(hit.id)) {
        return;
      }
      onSelect({ gameId: hit.id, title: hit.summary.title, slug: hit.summary.slug });
      setQuery('');
      onClose();
    },
    [excluded, onClose, onSelect],
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
        <View
          style={{
            paddingTop: insets.top,
            borderBottomWidth: 1,
            borderBottomColor: theme.color('color.border.default'),
            paddingHorizontal: theme.space('space.4'),
            paddingBottom: theme.space('space.3'),
            gap: theme.space('space.3'),
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space('space.2') }}>
            <Text role="heading" style={{ flex: 1 }}>
              Add game
            </Text>
            <Button
              variant="ghost"
              size="sm"
              accessibilityLabel="Close game picker"
              onPress={onClose}
            >
              Close
            </Button>
          </View>
          <TextField
            label="Search games"
            value={query}
            onChangeText={setQuery}
            autoFocus
            autoCorrect={false}
            placeholder="Search by title"
          />
        </View>

        {normalized.length === 0 ? (
          <View style={{ padding: theme.space('space.6') }}>
            <EmptyState
              title="Search the catalog"
              description="Find an existing game, then place it on the board."
            />
          </View>
        ) : null}

        {normalized.length > 0 && search.status === 'empty' ? (
          <View style={{ padding: theme.space('space.6') }}>
            <EmptyState title="No games found" description="Try a different title." />
          </View>
        ) : null}

        {normalized.length > 0 && (search.status === 'results' || search.status === 'searching') ? (
          <FlatList
            data={games}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            windowSize={7}
            maxToRenderPerBatch={8}
            initialNumToRender={8}
            removeClippedSubviews
            renderItem={({ item }) => {
              const blocked = excluded.has(item.id);
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: blocked }}
                  accessibilityLabel={
                    blocked ? `${item.summary.title} already on board` : `Add ${item.summary.title}`
                  }
                  disabled={blocked}
                  onPress={() => {
                    onPick(item);
                  }}
                  style={{
                    paddingHorizontal: theme.space('space.4'),
                    paddingVertical: theme.space('space.3'),
                    minHeight: theme.space('space.12'),
                    borderBottomWidth: 1,
                    borderBottomColor: theme.color('color.border.default'),
                    opacity: blocked ? 0.45 : 1,
                  }}
                >
                  <Text role="label" color="color.text.primary">
                    {item.summary.title}
                  </Text>
                  <Text role="meta" color="color.text.tertiary">
                    {blocked ? 'Already on board' : item.summary.slug}
                  </Text>
                </Pressable>
              );
            }}
            onEndReached={() => {
              search.loadMore();
            }}
            onEndReachedThreshold={0.4}
            contentContainerStyle={{ paddingBottom: theme.space('space.8') }}
          />
        ) : null}
      </Screen>
    </Modal>
  );
}
