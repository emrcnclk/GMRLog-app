import { Button, ErrorBanner, Screen, Text, useTheme } from '@gmrlog/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useConnectivityStore } from '../../../src/state/stores';
import { mapBoardError } from '../../boards/shared/board-model';
import { GamePicker } from '../../boards/shared/game-picker';
import { CollectionEntryCard } from '../components/collection-entry-card';
import { CollectionErrorState } from '../components/collection-error-state';
import { CollectionDetailSkeleton } from '../components/collection-skeleton';
import {
  addCollectionEntry,
  entriesToPutPayload,
  moveCollectionEntry,
  removeCollectionEntry,
  toEditableEntries,
  type EditableCollectionEntry,
} from '../hooks/collection-model';
import { useCollection, useReplaceEntries } from '../hooks/use-collections';

/** Whole-board entries editor — PUT /collections/{id}/entries only. */
export function CollectionEntriesScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const collectionId = typeof params.id === 'string' ? params.id : '';
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const detail = useCollection(collectionId);
  const replace = useReplaceEntries(collectionId);
  const [entries, setEntries] = useState<EditableCollectionEntry[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [banner, setBanner] = useState<{ title: string; description: string } | null>(null);

  useEffect(() => {
    if (detail.collection) {
      setEntries(toEditableEntries(detail.collection.entries));
    }
  }, [detail.collection]);

  const excluded = useMemo(() => entries.map((e) => e.gameId), [entries]);
  const saving = replace.isPending;

  const onSave = useCallback(async () => {
    setBanner(null);
    try {
      await replace.mutateAsync(entriesToPutPayload(entries));
      router.back();
    } catch (error) {
      setBanner(mapBoardError(error, isOnline));
    }
  }, [entries, isOnline, replace, router]);

  if (detail.isPending && !detail.collection) {
    return (
      <Screen style={{ paddingTop: 0, paddingBottom: 0 }}>
        <CollectionDetailSkeleton />
      </Screen>
    );
  }

  if (detail.isError || !detail.collection) {
    const mapped = mapBoardError(detail.error, isOnline);
    return (
      <Screen style={{ paddingTop: 0, paddingBottom: 0 }}>
        <CollectionErrorState
          title={mapped.title}
          description={mapped.description}
          isOffline={!isOnline}
          onRetry={() => {
            void detail.refetch();
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']} style={{ paddingTop: 0, paddingBottom: 0 }}>
      <View
        style={{
          borderBottomWidth: 1,
          borderBottomColor: theme.color('color.border.default'),
          minHeight: theme.space('space.12'),
          paddingHorizontal: theme.space('space.4'),
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.space('space.2'),
        }}
      >
        <Button
          variant="ghost"
          size="sm"
          accessibilityLabel="Close"
          onPress={() => {
            router.back();
          }}
        >
          Close
        </Button>
        <Text role="heading" style={{ flex: 1 }} numberOfLines={1}>
          Entries
        </Text>
        <Button
          variant="primary"
          size="sm"
          accessibilityLabel="Save entries"
          loading={saving}
          disabled={saving}
          onPress={() => {
            void onSave();
          }}
        >
          Save
        </Button>
      </View>

      {banner ? (
        <View style={{ padding: theme.space('space.4') }}>
          <ErrorBanner title={banner.title} description={banner.description} />
        </View>
      ) : null}

      <View style={{ padding: theme.space('space.4') }}>
        <Button
          variant="secondary"
          accessibilityLabel="Add game"
          disabled={saving}
          onPress={() => {
            setPickerOpen(true);
          }}
        >
          Add game
        </Button>
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.gameId}
        windowSize={9}
        maxToRenderPerBatch={12}
        initialNumToRender={10}
        removeClippedSubviews
        renderItem={({ item, index }) => (
          <CollectionEntryCard
            entry={{
              gameId: item.gameId,
              position: index,
              note: item.note,
              game: { id: item.gameId, title: item.title, slug: item.gameId, coverUrl: null },
            }}
            editable
            onMoveUp={() => {
              setEntries((prev) => moveCollectionEntry(prev, index, index - 1));
            }}
            onMoveDown={() => {
              setEntries((prev) => moveCollectionEntry(prev, index, index + 1));
            }}
            onRemove={() => {
              setEntries((prev) => removeCollectionEntry(prev, item.gameId));
            }}
          />
        )}
        ListEmptyComponent={
          <View style={{ padding: theme.space('space.6') }}>
            <Text role="body" color="color.text.tertiary">
              Add games from the catalog. Order is saved with a whole-board replace.
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + theme.space('space.8') }}
      />

      <GamePicker
        visible={pickerOpen}
        excludedGameIds={excluded}
        onClose={() => {
          setPickerOpen(false);
        }}
        onSelect={(game) => {
          setEntries((prev) => {
            const next = addCollectionEntry(prev, game);
            if (next === 'duplicate') {
              setBanner({
                title: 'Duplicate game',
                description: 'That game is already in this collection.',
              });
              return prev;
            }
            return next;
          });
        }}
      />
    </Screen>
  );
}
