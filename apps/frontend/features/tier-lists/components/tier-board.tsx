import type { TierListResponse } from '@gmrlog/types';
import { Text, useTheme } from '@gmrlog/ui';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { resolveDropZone, type DropZoneLayout } from '../hooks/tier-drag';
import {
  moveGameOnBoard,
  RANKED_TIER_LABELS,
  toEditableBoard,
  TRAY_LABEL,
} from '../hooks/tier-list-model';
import { useReplaceSlots } from '../hooks/use-tier-lists';

import { COVER_GAP, TierCover, TierCoverGhost } from './tier-cover';
import { TierPlate } from './tier-plate';

export interface TierBoardProps {
  tierList: TierListResponse;
  /** Only the owner may reorder — `TierListsService.assertOwner` guards the write server-side too. */
  owner: boolean;
  /**
   * The screen's outer scroll must freeze for the duration of a drag: the
   * ghost's position and every row's drop-zone are measured once in window
   * space at drag start (`measureInWindow`), and go stale the instant the
   * page scrolls under them.
   */
  onDraggingChange?: (dragging: boolean) => void;
}

function measureInWindow(view: View | null): Promise<Omit<DropZoneLayout, 'label'> | null> {
  return new Promise((resolve) => {
    if (!view) {
      resolve(null);
      return;
    }
    view.measureInWindow((x, y, width, height) => {
      resolve({ y, height });
    });
  });
}

/**
 * §20's tier board — the read view for a visitor, the drag surface for the
 * owner. Drag position is a plain `useState` point recomputed every gesture
 * frame, not an `Animated`/Reanimated-driven transform: `CLAUDE.md`'s known
 * trap is `Animated.timing` + `interpolate(transform)` going dead on this RNW
 * build, and the fix the codebase already settled on (`Toggle`) is to compute
 * the value directly rather than animate to it. `TierCoverGhost` does the
 * same — its position is `state.point`, applied straight to `style.left/top`.
 */
export function TierBoard({ tierList, owner, onDraggingChange }: TierBoardProps) {
  const theme = useTheme();
  const replaceSlots = useReplaceSlots(tierList.id);
  const board = useMemo(() => toEditableBoard(tierList.slots), [tierList.slots]);
  const gamesById = useMemo(() => {
    const map = new Map<string, { coverUrl: string | null }>();
    for (const slot of tierList.slots) {
      for (const game of slot.games) {
        if (game.game) {
          map.set(game.gameId, { coverUrl: game.game.coverUrl });
        }
      }
    }
    return map;
  }, [tierList.slots]);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragPoint, setDragPoint] = useState<{ x: number; y: number } | null>(null);
  const [hoverLabel, setHoverLabel] = useState<string | null>(null);

  const containerRef = useRef<View | null>(null);
  const rowRefs = useRef<Record<string, View | null>>({});
  const containerOriginRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const zonesRef = useRef<DropZoneLayout[]>([]);

  const rowLabels = useMemo(() => [...RANKED_TIER_LABELS, TRAY_LABEL], []);

  const onDragStart = useCallback(
    (gameId: string) => {
      setDraggingId(gameId);
      onDraggingChange?.(true);
      void measureInWindow(containerRef.current).then((origin) => {
        if (origin) {
          containerOriginRef.current = { x: 0, y: origin.y };
        }
      });
      void Promise.all(
        rowLabels.map(async (label) => {
          const layout = await measureInWindow(rowRefs.current[label] ?? null);
          return layout ? { ...layout, label } : null;
        }),
      ).then((zones) => {
        zonesRef.current = zones.filter((zone): zone is DropZoneLayout => zone !== null);
      });
    },
    [onDraggingChange, rowLabels],
  );

  const onDragMove = useCallback((x: number, y: number) => {
    setDragPoint({ x, y });
    setHoverLabel(resolveDropZone(zonesRef.current, y));
  }, []);

  const onDragEnd = useCallback(() => {
    setDraggingId((currentId) => {
      const target = hoverLabel;
      if (currentId && target) {
        const targetSlot = board.find((slot) => slot.label === target);
        const nextBoard = moveGameOnBoard(board, currentId, target, targetSlot?.games.length ?? 0);
        replaceSlots.mutate({
          slots: nextBoard.map((slot) => ({
            label: slot.label,
            gameIds: slot.games.map((game) => game.gameId),
          })),
        });
      }
      return null;
    });
    setDragPoint(null);
    setHoverLabel(null);
    onDraggingChange?.(false);
  }, [board, hoverLabel, onDraggingChange, replaceSlots]);

  const draggingGame = draggingId
    ? board.flatMap((slot) => slot.games).find((game) => game.gameId === draggingId)
    : undefined;

  return (
    <View ref={containerRef} style={{ position: 'relative' }}>
      <View style={{ paddingHorizontal: theme.space('space.5'), gap: 2 }}>
        {RANKED_TIER_LABELS.map((label, index) => {
          const slot = board.find((row) => row.label === label);
          const games = slot?.games ?? [];
          const isHovered = owner && draggingId !== null && hoverLabel === label;

          return (
            <View
              key={label}
              ref={(node) => {
                rowRefs.current[label] = node;
              }}
              style={{
                flexDirection: 'row',
                minHeight: 66,
                borderRadius: theme.radius('radius.md'),
                overflow: 'hidden',
                backgroundColor: theme.color('color.surface.primary'),
                borderWidth: 1,
                borderColor: isHovered
                  ? theme.color('color.accent.default')
                  : theme.color('color.border.default'),
              }}
            >
              <TierPlate label={label} rankIndex={index} rankCount={RANKED_TIER_LABELS.length} />
              <View
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: COVER_GAP,
                  padding: theme.space('space.2'),
                  alignItems: 'center',
                }}
              >
                {games.map((game) => (
                  <TierCover
                    key={game.gameId}
                    game={{ ...game, coverUrl: gamesById.get(game.gameId)?.coverUrl }}
                    draggable={owner}
                    isLifted={draggingId === game.gameId}
                    onDragStart={onDragStart}
                    onDragMove={onDragMove}
                    onDragEnd={onDragEnd}
                  />
                ))}
                {games.length === 0 ? (
                  <Text role="meta" color="color.text.tertiary">
                    Empty
                  </Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>

      <View style={{ padding: theme.space('space.5'), gap: theme.space('space.3') }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'baseline',
            justifyContent: 'space-between',
          }}
        >
          <Text role="metaSm" color="color.text.tertiary">
            Unranked
          </Text>
          <Text role="meta" color="color.text.tertiary">
            {board.find((row) => row.label === TRAY_LABEL)?.games.length ?? 0}
          </Text>
        </View>
        <View
          ref={(node) => {
            rowRefs.current[TRAY_LABEL] = node;
          }}
          style={{
            minHeight: 60,
            borderRadius: theme.radius('radius.md'),
            backgroundColor: theme.color('color.surface.primary'),
            borderWidth: 1,
            borderColor:
              owner && draggingId !== null && hoverLabel === TRAY_LABEL
                ? theme.color('color.accent.default')
                : theme.color('color.border.default'),
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              flexDirection: 'row',
              gap: COVER_GAP,
              padding: theme.space('space.2'),
              alignItems: 'center',
              flexGrow: 1,
            }}
          >
            {(board.find((row) => row.label === TRAY_LABEL)?.games ?? []).map((game) => (
              <TierCover
                key={game.gameId}
                game={{ ...game, coverUrl: gamesById.get(game.gameId)?.coverUrl }}
                draggable={owner}
                isLifted={draggingId === game.gameId}
                onDragStart={onDragStart}
                onDragMove={onDragMove}
                onDragEnd={onDragEnd}
              />
            ))}
            {(board.find((row) => row.label === TRAY_LABEL)?.games.length ?? 0) === 0 ? (
              <Text role="meta" color="color.text.tertiary">
                All placed.
              </Text>
            ) : null}
          </ScrollView>
        </View>
      </View>

      {draggingGame && dragPoint ? (
        <TierCoverGhost
          game={{ ...draggingGame, coverUrl: gamesById.get(draggingGame.gameId)?.coverUrl }}
          point={{
            x: dragPoint.x - containerOriginRef.current.x,
            y: dragPoint.y - containerOriginRef.current.y,
          }}
        />
      ) : null}
    </View>
  );
}
