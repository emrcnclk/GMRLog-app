import type { LibraryEntryResponse } from '@gmrlog/types';
import {
  AspectBox,
  Chip,
  EmptyState,
  Rail,
  SegmentedTabs,
  Skeleton,
  Text,
  useTheme,
} from '@gmrlog/ui';
import { memo, useMemo, useState } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';

import { CachedImage } from '../../../../src/assets/cached-image';
import { buildGameShelves, type GameShelf } from '../../hooks/profile-insights-model';

export type ShelfViewMode = 'grid' | 'list';

export interface GameShelvesProps {
  entries: readonly LibraryEntryResponse[];
  isPending: boolean;
  onPressGame: (gameId: string) => void;
}

const COVER_TILE = 108;
const MIN_GRID_TILE = 96;

/**
 * D3.27 Phase 6 — Steam-style collection showcase.
 *
 * Shelves come from the closed LibraryStatus vocabulary only; `hidden` is
 * excluded by the model. Grid and list are both available, and the choice is
 * per-session rather than persisted — it is a browsing mode, not an identity
 * setting.
 */
function GameShelvesComponent({ entries, isPending, onPressGame }: GameShelvesProps) {
  const theme = useTheme();
  const shelves = useMemo(() => buildGameShelves(entries), [entries]);
  const [mode, setMode] = useState<ShelfViewMode>('grid');
  const [activeShelf, setActiveShelf] = useState<string | null>(null);

  if (isPending && entries.length === 0) {
    return (
      <View style={{ paddingHorizontal: theme.space('space.4'), gap: theme.space('space.2') }}>
        <Skeleton shape="line" width="35%" />
        <View style={{ flexDirection: 'row', gap: theme.space('space.2') }}>
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton
              key={`shelf-skeleton-${String(index)}`}
              shape="rect"
              width={COVER_TILE}
              height={COVER_TILE / (3 / 4)}
            />
          ))}
        </View>
      </View>
    );
  }

  if (shelves.length === 0) {
    return (
      <EmptyState
        title="Your shelves are empty"
        description="Add games to your library and they will organise themselves here."
      />
    );
  }

  // Deduplicate the rail-only slices out of the browsable shelf list.
  const browsable = shelves.filter((shelf) => shelf.key !== 'recent' && shelf.key !== 'completed');
  const selected = browsable.find((shelf) => shelf.key === activeShelf) ?? null;

  return (
    <View style={{ gap: theme.space('space.4') }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: theme.space('space.4'),
          gap: theme.space('space.2'),
        }}
      >
        <Text role="title">Collection</Text>
        <View style={{ flexDirection: 'row', gap: theme.space('space.2') }}>
          <Chip
            selected={mode === 'grid'}
            accessibilityLabel="Grid view"
            onPress={() => {
              setMode('grid');
            }}
          >
            Grid
          </Chip>
          <Chip
            selected={mode === 'list'}
            accessibilityLabel="List view"
            onPress={() => {
              setMode('list');
            }}
          >
            List
          </Chip>
        </View>
      </View>

      <SegmentedTabs
        variant="pill"
        accessibilityLabel="Shelves"
        items={[
          { id: 'all', label: 'All shelves' },
          ...browsable.map((shelf) => ({
            id: shelf.key,
            label: shelf.title,
            count: shelf.entries.length,
          })),
        ]}
        activeId={activeShelf ?? 'all'}
        onChange={(id) => {
          setActiveShelf(id === 'all' ? null : id);
        }}
      />

      {selected !== null ? (
        <ShelfBody shelf={selected} mode={mode} onPressGame={onPressGame} />
      ) : mode === 'grid' ? (
        <View style={{ gap: theme.space('space.5') }}>
          {shelves
            .filter((shelf) => shelf.key !== 'completed-all' && shelf.key !== 'owned')
            .map((shelf) => (
              <Rail
                key={shelf.key}
                title={shelf.title}
                subtitle={`${String(shelf.entries.length)} ${
                  shelf.entries.length === 1 ? 'game' : 'games'
                }`}
                gap={theme.space('space.2')}
              >
                {shelf.entries.slice(0, 20).map((entry) => (
                  <CoverTile
                    key={`${shelf.key}-${entry.gameId}`}
                    entry={entry}
                    onPress={onPressGame}
                  />
                ))}
              </Rail>
            ))}
        </View>
      ) : (
        <View style={{ gap: theme.space('space.5') }}>
          {browsable.map((shelf) => (
            <ShelfBody key={shelf.key} shelf={shelf} mode="list" onPressGame={onPressGame} />
          ))}
        </View>
      )}
    </View>
  );
}

function ShelfBody({
  shelf,
  mode,
  onPressGame,
}: {
  shelf: GameShelf;
  mode: ShelfViewMode;
  onPressGame: (gameId: string) => void;
}) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const gutter = theme.space('space.4');
  const gap = theme.space('space.2');

  const { tileWidth } = useMemo(() => {
    const available = Math.max(MIN_GRID_TILE, width - gutter * 2);
    const count = Math.max(2, Math.min(6, Math.floor(available / MIN_GRID_TILE)));
    return { tileWidth: (available - gap * (count - 1)) / count };
  }, [gap, gutter, width]);

  return (
    <View style={{ gap: theme.space('space.3') }}>
      <View style={{ paddingHorizontal: gutter, gap: theme.space('space.1') }}>
        <Text role="title">{shelf.title}</Text>
        <Text role="meta" color="color.text.tertiary">
          {`${String(shelf.entries.length)} ${shelf.entries.length === 1 ? 'game' : 'games'}`}
        </Text>
      </View>

      {mode === 'grid' ? (
        <View
          accessibilityRole="list"
          style={{ flexDirection: 'row', flexWrap: 'wrap', gap, paddingHorizontal: gutter }}
        >
          {shelf.entries.map((entry) => (
            <CoverTile key={entry.gameId} entry={entry} width={tileWidth} onPress={onPressGame} />
          ))}
        </View>
      ) : (
        <View accessibilityRole="list">
          {shelf.entries.map((entry) => (
            <ListRow key={entry.gameId} entry={entry} onPress={onPressGame} />
          ))}
        </View>
      )}
    </View>
  );
}

function CoverTile({
  entry,
  width = COVER_TILE,
  onPress,
}: {
  entry: LibraryEntryResponse;
  width?: number;
  onPress: (gameId: string) => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${entry.game.title}`}
      onPress={() => {
        onPress(entry.gameId);
      }}
      style={({ pressed }) => ({ width, gap: theme.space('space.1'), opacity: pressed ? 0.85 : 1 })}
    >
      <AspectBox ratio="cover">
        {entry.game.coverUrl !== null ? (
          <CachedImage
            source={{ uri: entry.game.coverUrl }}
            priority="low"
            contentFit="cover"
            accessibilityIgnoresInvertColors
            style={{ width: '100%', height: '100%' }}
          />
        ) : null}
      </AspectBox>
      <Text role="meta" numberOfLines={2}>
        {entry.game.title}
      </Text>
    </Pressable>
  );
}

function ListRow({
  entry,
  onPress,
}: {
  entry: LibraryEntryResponse;
  onPress: (gameId: string) => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${entry.game.title}`}
      onPress={() => {
        onPress(entry.gameId);
      }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space('space.3'),
        paddingHorizontal: theme.space('space.4'),
        paddingVertical: theme.space('space.2'),
        borderBottomWidth: 1,
        borderBottomColor: theme.color('color.border.default'),
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ width: theme.space('space.10') }}>
        <AspectBox ratio="cover" radius="radius.sm">
          {entry.game.coverUrl !== null ? (
            <CachedImage
              source={{ uri: entry.game.coverUrl }}
              priority="low"
              contentFit="cover"
              accessibilityIgnoresInvertColors
              style={{ width: '100%', height: '100%' }}
            />
          ) : null}
        </AspectBox>
      </View>

      <View style={{ flex: 1, gap: theme.space('space.1') }}>
        <Text role="label" numberOfLines={1}>
          {entry.game.title}
        </Text>
        <Text role="meta" color="color.text.tertiary">
          {entry.source === 'steam_import' ? 'Imported from Steam' : 'Added manually'}
        </Text>
      </View>
    </Pressable>
  );
}

export const GameShelves = memo(GameShelvesComponent);
