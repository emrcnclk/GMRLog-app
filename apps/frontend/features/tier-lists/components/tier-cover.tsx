import { useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import { CachedImage } from '../../../src/assets/cached-image';
import type { EditableTierGame } from '../hooks/tier-list-model';

/** §20: "a wrapping grid of 54×72 covers". Not on the space scale — a content dimension, per `Avatar`'s `sizeOverride` precedent. */
export const COVER_WIDTH = 54;
export const COVER_HEIGHT = 72;
/** §20: "with 6px gaps". */
export const COVER_GAP = 6;

export interface TierCoverProps {
  game: EditableTierGame & { coverUrl?: string | null };
  /** Disabled for a viewer who isn't the owner — read-only grid, no gesture. */
  draggable: boolean;
  /** True while this exact cover is the one being lifted — dims it in place while the drag ghost follows the finger. */
  isLifted: boolean;
  onDragStart: (gameId: string) => void;
  onDragMove: (absoluteX: number, absoluteY: number) => void;
  onDragEnd: () => void;
}

function TierCoverComponent({
  game,
  draggable,
  isLifted,
  onDragStart,
  onDragMove,
  onDragEnd,
}: TierCoverProps) {
  const theme = useTheme();

  const pan = Gesture.Pan()
    .enabled(draggable)
    .minDistance(4)
    .onBegin(() => {
      runOnJS(onDragStart)(game.gameId);
    })
    .onUpdate((event) => {
      runOnJS(onDragMove)(event.absoluteX, event.absoluteY);
    })
    .onEnd(() => {
      runOnJS(onDragEnd)();
    })
    .onFinalize(() => {
      runOnJS(onDragEnd)();
    });

  const content = (
    <View
      accessibilityRole={draggable ? 'button' : 'image'}
      accessibilityLabel={draggable ? `${game.title}, drag to move` : game.title}
      style={{
        width: COVER_WIDTH,
        height: COVER_HEIGHT,
        borderRadius: theme.radius('radius.sm'),
        overflow: 'hidden',
        backgroundColor: theme.color('color.surface.secondary'),
        borderWidth: 1,
        borderColor: theme.color('color.border.default'),
        opacity: isLifted ? 0.35 : 1,
      }}
    >
      {game.coverUrl ? (
        <CachedImage
          source={{ uri: game.coverUrl }}
          style={{ width: COVER_WIDTH, height: COVER_HEIGHT }}
          contentFit="cover"
          accessibilityIgnoresInvertColors
        />
      ) : null}
    </View>
  );

  if (!draggable) {
    return content;
  }

  return <GestureDetector gesture={pan}>{content}</GestureDetector>;
}

export const TierCover = memo(TierCoverComponent);

export interface TierCoverGhostProps {
  game: EditableTierGame & { coverUrl?: string | null };
  /** Page-space centre point to draw the ghost at — the finger's current position. */
  point: { x: number; y: number };
}

/**
 * The lifted cover that follows the finger during a drag. A plain,
 * directly-computed position and `scale(1.06)` — no `Animated.timing` /
 * `interpolate(transform)`, which never advances on this RNW build
 * (`Toggle`'s note). This is the same "computed snap" the toggle knob uses,
 * just re-computed every gesture frame instead of once on press.
 */
export function TierCoverGhost({ game, point }: TierCoverGhostProps) {
  const theme = useTheme();
  const shadow = theme.elevation('shadow.lg');

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: point.x - COVER_WIDTH / 2,
        top: point.y - COVER_HEIGHT / 2,
        width: COVER_WIDTH,
        height: COVER_HEIGHT,
        transform: [{ scale: 1.06 }],
        zIndex: 10,
        // The shadow sits on this outer view; `overflow: hidden` for the
        // rounded image clip has to live one level in, or it clips the
        // shadow along with the corners.
        ...shadow,
      }}
    >
      <View
        style={{
          width: COVER_WIDTH,
          height: COVER_HEIGHT,
          borderRadius: theme.radius('radius.sm'),
          overflow: 'hidden',
          backgroundColor: theme.color('color.surface.secondary'),
          borderWidth: 1,
          borderColor: theme.color('color.accent.default'),
        }}
      >
        {game.coverUrl ? (
          <CachedImage
            source={{ uri: game.coverUrl }}
            style={{ width: COVER_WIDTH, height: COVER_HEIGHT }}
            contentFit="cover"
            accessibilityIgnoresInvertColors
          />
        ) : null}
      </View>
    </View>
  );
}
