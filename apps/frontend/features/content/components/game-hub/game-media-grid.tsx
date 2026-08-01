import type { GameMediaResponse } from '@gmrlog/types';
import { AspectBox, EmptyState, Skeleton, Text, useTheme } from '@gmrlog/ui';
import { memo, useMemo } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { CachedImage } from '../../../../src/assets/cached-image';

export interface GameMediaGridProps {
  items: readonly GameMediaResponse[];
  isPending: boolean;
  gameTitle: string;
  emptyTitle: string;
  emptyDescription: string;
}

/** Widest tile we allow before adding another column — keeps tablets from stretching. */
const MAX_TILE_WIDTH = 320;
const MIN_TILE_WIDTH = 150;

/**
 * Responsive artwork grid. Column count is derived from the live viewport rather
 * than a breakpoint table, so phone / tablet / rotated all resolve sensibly.
 */
function GameMediaGridComponent({
  items,
  isPending,
  gameTitle,
  emptyTitle,
  emptyDescription,
}: GameMediaGridProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const gutter = theme.space('space.4');
  const gap = theme.space('space.2');

  const { columns, tileWidth } = useMemo(() => {
    const available = Math.max(MIN_TILE_WIDTH, width - gutter * 2);
    const count = Math.max(1, Math.min(4, Math.floor(available / MIN_TILE_WIDTH)));
    const resolved = (available - gap * (count - 1)) / count;
    // One column on a narrow phone would give an enormous tile; cap and re-flow.
    if (count === 1 && resolved > MAX_TILE_WIDTH) {
      return { columns: 2, tileWidth: (available - gap) / 2 };
    }
    return { columns: count, tileWidth: resolved };
  }, [gap, gutter, width]);

  if (isPending && items.length === 0) {
    return (
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap,
          paddingHorizontal: gutter,
        }}
      >
        {Array.from({ length: columns * 2 }, (_, index) => (
          <AspectBox
            key={`media-skeleton-${String(index)}`}
            ratio="hero"
            style={{ width: tileWidth }}
          >
            <Skeleton shape="rect" height={tileWidth / (16 / 9)} />
          </AspectBox>
        ))}
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={{ paddingHorizontal: gutter }}>
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </View>
    );
  }

  return (
    <View
      accessibilityRole="list"
      accessibilityLabel={`${gameTitle} media, ${String(items.length)} items`}
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap, paddingHorizontal: gutter }}
    >
      {items.map((item, index) => (
        <AspectBox key={item.id} ratio="hero" style={{ width: tileWidth }}>
          {item.url !== null ? (
            <CachedImage
              source={{ uri: item.url }}
              // Only the first screen of tiles is worth prioritising.
              priority={index < columns * 2 ? 'normal' : 'low'}
              contentFit="cover"
              accessibilityIgnoresInvertColors
              accessibilityLabel={`${gameTitle} screenshot ${String(index + 1)}`}
              style={{ width: '100%', height: '100%' }}
            />
          ) : null}
        </AspectBox>
      ))}
    </View>
  );
}

export interface GameVideoListProps {
  items: readonly GameMediaResponse[];
  trailerUrl: string | null;
  isPending: boolean;
  gameTitle: string;
  onOpenUrl: (url: string) => void;
}

/**
 * Video list. Playback is deliberately delegated to the platform browser: the
 * catalog stores provider watch URLs (YouTube ids for IGDB), not streamable
 * files, so an in-app player would have nothing to play.
 */
function GameVideoListComponent({
  items,
  trailerUrl,
  isPending,
  gameTitle,
  onOpenUrl,
}: GameVideoListProps) {
  const theme = useTheme();

  const rows = useMemo(() => {
    const seen = new Set<string>();
    const resolved: { key: string; url: string; label: string }[] = [];

    if (trailerUrl !== null && trailerUrl.length > 0) {
      seen.add(trailerUrl);
      resolved.push({ key: 'trailer', url: trailerUrl, label: 'Official trailer' });
    }
    items.forEach((item, index) => {
      if (item.url === null || item.url.length === 0 || seen.has(item.url)) {
        return;
      }
      seen.add(item.url);
      resolved.push({
        key: item.id,
        url: item.url,
        label: item.kind === 'trailer' ? 'Trailer' : `Video ${String(index + 1)}`,
      });
    });
    return resolved;
  }, [items, trailerUrl]);

  if (isPending && rows.length === 0) {
    return (
      <View style={{ paddingHorizontal: theme.space('space.4'), gap: theme.space('space.2') }}>
        <Skeleton shape="rect" height={theme.space('space.16')} />
        <Skeleton shape="rect" height={theme.space('space.16')} />
      </View>
    );
  }

  if (rows.length === 0) {
    return (
      <View style={{ paddingHorizontal: theme.space('space.4') }}>
        <EmptyState
          title="No videos yet"
          description={`The catalog has not mirrored any video for ${gameTitle}.`}
        />
      </View>
    );
  }

  return (
    <View
      accessibilityRole="list"
      style={{ paddingHorizontal: theme.space('space.4'), gap: theme.space('space.2') }}
    >
      {rows.map((row) => (
        <VideoRow key={row.key} label={row.label} url={row.url} onPress={onOpenUrl} />
      ))}
    </View>
  );
}

function VideoRow({
  label,
  url,
  onPress,
}: {
  label: string;
  url: string;
  onPress: (url: string) => void;
}) {
  const theme = useTheme();

  return (
    <View
      style={{
        borderRadius: theme.radius('radius.lg'),
        borderWidth: 1,
        borderColor: theme.color('color.border.default'),
        backgroundColor: theme.color('color.surface.secondary'),
        padding: theme.space('space.4'),
        gap: theme.space('space.1'),
      }}
    >
      <Text
        role="label"
        color="color.accent.default"
        accessibilityRole="link"
        onPress={() => {
          onPress(url);
        }}
      >
        {label}
      </Text>
      <Text role="meta" color="color.text.tertiary" numberOfLines={1}>
        {url}
      </Text>
    </View>
  );
}

export const GameMediaGrid = memo(GameMediaGridComponent);
export const GameVideoList = memo(GameVideoListComponent);
