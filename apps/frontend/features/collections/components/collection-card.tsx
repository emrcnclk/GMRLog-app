import type { CollectionResponse } from '@gmrlog/types';
import {
  HIDDEN_FROM_ASSISTIVE_TECH,
  Icon,
  SCREEN_GUTTER,
  Text,
  pressableMotionStyle,
  useReduceMotion,
  useTheme,
} from '@gmrlog/ui';
import { Clock } from 'lucide-react-native';
import { memo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { CachedImage } from '../../../src/assets/cached-image';
import { formatUpdatedAt } from '../hooks/collection-model';
import { collectionMosaicCovers, collectionStats } from '../hooks/collection-view-model';

export interface CollectionCardProps {
  collection: CollectionResponse;
  onPress: (collectionId: string) => void;
  /** `grid` renders a square tile; `list` a full-width row. */
  layout?: 'grid' | 'list';
  /** Tile width in grid layout — supplied by the list so columns line up. */
  width?: number;
}

/**
 * A collection, shown as the thing it collects (`SCREEN_REDESIGNS.md` §10).
 *
 * Cover-mosaic card: a fixed 96px, four-cell strip across the top (always four
 * cells, even when the collection has fewer than four covers — the empty ones
 * stay tinted rather than the grid reflowing), then title/count, description,
 * and a monospace footer. §10 also asks for a "likes" figure in that footer;
 * `CollectionResponse` has no reaction field (its own doc comment: "reaction /
 * collaboration / share fields are not invented"), so this reads
 * `followerCount` under its real name instead, matching the count the pre-card
 * version of this component already showed. The visibility badge the old row
 * carried is dropped — §10's content block is explicit about what belongs in
 * it and visibility isn't on the list; it's still one tap away on the
 * collection's own screen.
 *
 * The footer's clock glyph takes `Clock` straight from `lucide-react-native`
 * rather than through `Icon`'s registry, the same way `ProCard` takes
 * `Diamond` directly: `packages/ui`'s own tsconfig (unlike this app's) fails
 * `Clock`/`Plus`/`Diamond`/`Watch`/`Timer` specifically with "no exported
 * member" even though the package's `.d.ts` genuinely declares them once each
 * — a barrel-resolution quirk in this lucide-react-native version under that
 * tsconfig, not a missing registration. Confirmed by isolating it to a probe
 * file: those five names fail under `packages/ui`, the same import list
 * typechecks clean under this app's tsconfig, and the per-icon subpath form
 * (`lucide-react-native/icons/clock`) sidesteps it too.
 */
function CollectionCardComponent({
  collection,
  onPress,
  layout = 'list',
  width,
}: CollectionCardProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const [hovered, setHovered] = useState(false);
  const stats = collectionStats(collection);
  const updated = formatUpdatedAt(collection.updatedAt);
  const covers = collectionMosaicCovers(collection);
  const isGrid = layout === 'grid';

  const gameLabel = `${String(stats.gameCount)} ${stats.gameCount === 1 ? 'game' : 'games'}`;
  const followerLabel = `${String(stats.followerCount)} ${
    stats.followerCount === 1 ? 'follower' : 'followers'
  }`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${collection.title}, ${gameLabel}, ${followerLabel}${
        updated ? `, updated ${updated}` : ''
      }`}
      onPress={() => {
        onPress(collection.id);
      }}
      onHoverIn={() => {
        setHovered(true);
      }}
      onHoverOut={() => {
        setHovered(false);
      }}
      style={({ pressed }) => [
        {
          width,
          marginHorizontal: isGrid ? undefined : theme.space(SCREEN_GUTTER),
          marginBottom: isGrid ? undefined : theme.space('space.3'),
          borderRadius: theme.radius('radius.lg'),
          borderWidth: 1,
          borderColor: hovered
            ? theme.color('color.accent.default')
            : theme.color('color.border.default'),
          backgroundColor: theme.color('color.surface.card'),
          overflow: 'hidden',
        },
        pressableMotionStyle(pressed, reduceMotion),
      ]}
    >
      <CoverMosaic covers={covers} />

      <View style={{ padding: theme.space('space.3'), gap: theme.space('space.2') }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: theme.space('space.2'),
          }}
        >
          <Text role="headline" color="color.text.primary" numberOfLines={2} style={{ flex: 1 }}>
            {collection.title}
          </Text>
          <Text role="meta" color="color.text.tertiary">
            {gameLabel}
          </Text>
        </View>

        {collection.description ? (
          <Text role="body" color="color.text.secondary" numberOfLines={2}>
            {collection.description}
          </Text>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space('space.3') }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space('space.1') }}>
            <Icon name="users" decorative size={12} color="color.text.tertiary" />
            <Text role="meta" color="color.text.tertiary">
              {followerLabel}
            </Text>
          </View>
          {updated ? (
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space('space.1') }}
            >
              <View {...HIDDEN_FROM_ASSISTIVE_TECH}>
                <Clock size={12} color={theme.color('color.text.tertiary')} strokeWidth={1.75} />
              </View>
              <Text role="meta" color="color.text.tertiary">
                {`Updated ${updated}`}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

/**
 * The 96px, four-cell cover strip. Always four cells — `flex: 1` cells with a
 * literal 2px gap (a glyph-scale divider, not a layout gap, so it stays off
 * the space scale the same way an icon size or a status-dot ring does) mean
 * the grid never needs percentage math against an unknown card width. A
 * missing cover leaves its cell tinted rather than collapsing the grid, so a
 * one-game collection still reads as a 2×2 plate.
 *
 * Decorative throughout: the card's own accessibility label already names the
 * collection and its counts, so announcing four game covers underneath it
 * would be four stops of noise before the reader reaches anything useful.
 */
function CoverMosaic({ covers }: { covers: readonly string[] }) {
  const theme = useTheme();
  const cellA = covers[0] ?? null;
  const cellB = covers[1] ?? null;
  const cellC = covers[2] ?? null;
  const cellD = covers[3] ?? null;

  return (
    <View {...HIDDEN_FROM_ASSISTIVE_TECH} style={{ height: theme.space('space.24'), gap: 2 }}>
      <View style={{ flex: 1, flexDirection: 'row', gap: 2 }}>
        <MosaicCell url={cellA} />
        <MosaicCell url={cellB} />
      </View>
      <View style={{ flex: 1, flexDirection: 'row', gap: 2 }}>
        <MosaicCell url={cellC} />
        <MosaicCell url={cellD} />
      </View>
    </View>
  );
}

function MosaicCell({ url }: { url: string | null }) {
  const theme = useTheme();

  if (url === null) {
    return <View style={{ flex: 1, backgroundColor: theme.color('color.surface.secondary') }} />;
  }

  return (
    <CachedImage
      source={{ uri: url }}
      priority="low"
      contentFit="cover"
      accessibilityIgnoresInvertColors
      style={{ flex: 1, backgroundColor: theme.color('color.surface.secondary') }}
    />
  );
}

export const CollectionCard = memo(CollectionCardComponent);
