import { Button, ErrorBanner, Text, useTheme } from '@gmrlog/ui';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { GamePicker } from '../../boards/shared/game-picker';
import {
  addGameToBoard,
  boardToSlotsPutPayload,
  collectBoardGameIds,
  moveGameOnBoard,
  removeGameFromBoard,
  reorderGameInTier,
  type EditableTierSlot,
} from '../hooks/tier-list-model';

import { TierRow } from './tier-row';

export interface TierBuilderProps {
  board: EditableTierSlot[];
  onChange: (board: EditableTierSlot[]) => void;
  onSave: () => void;
  saving?: boolean;
  banner?: { title: string; description: string } | null;
}

/**
 * Tier board editor — local drag/drop via select + drop-on-row.
 * Persist with PUT /tier-lists/{id}/slots (whole-board replace).
 */
export function TierBuilder({
  board,
  onChange,
  onSave,
  saving = false,
  banner = null,
}: TierBuilderProps) {
  const theme = useTheme();
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [targetLabel, setTargetLabel] = useState<string>(board[0]?.label ?? 'S');
  const [localBanner, setLocalBanner] = useState<{ title: string; description: string } | null>(
    null,
  );

  const excluded = useMemo(() => collectBoardGameIds(board), [board]);
  const activeBanner = banner ?? localBanner;

  const onSelectGame = useCallback((gameId: string) => {
    setSelectedGameId((prev) => (prev === gameId ? null : gameId));
  }, []);

  const onDropHere = useCallback(
    (label: string) => {
      if (!selectedGameId) {
        return;
      }
      onChange(moveGameOnBoard(board, selectedGameId, label, Number.MAX_SAFE_INTEGER));
      setSelectedGameId(null);
    },
    [board, onChange, selectedGameId],
  );

  const onReorder = useCallback(
    (label: string, fromIndex: number, toIndex: number) => {
      onChange(reorderGameInTier(board, label, fromIndex, toIndex));
    },
    [board, onChange],
  );

  const onRemove = useCallback(
    (gameId: string) => {
      onChange(removeGameFromBoard(board, gameId));
      setSelectedGameId((prev) => (prev === gameId ? null : prev));
    },
    [board, onChange],
  );

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          paddingHorizontal: theme.space('space.4'),
          paddingVertical: theme.space('space.3'),
          gap: theme.space('space.2'),
          borderBottomWidth: 1,
          borderBottomColor: theme.color('color.border.default'),
        }}
      >
        <Text role="caption" color="color.text.tertiary">
          Long-press or tap a chip to pick it up, then tap a tier row to drop. Reorder with Left /
          Right.
        </Text>
        <View style={{ flexDirection: 'row', gap: theme.space('space.2'), flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            size="sm"
            accessibilityLabel="Add game to board"
            disabled={saving}
            onPress={() => {
              setPickerOpen(true);
            }}
          >
            Add game
          </Button>
          <Button
            variant="primary"
            size="sm"
            accessibilityLabel="Save tier board"
            loading={saving}
            disabled={saving}
            onPress={onSave}
          >
            Save board
          </Button>
        </View>
        {activeBanner ? (
          <ErrorBanner title={activeBanner.title} description={activeBanner.description} />
        ) : null}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: theme.space('space.10') }}>
        {board.map((slot) => (
          <TierRow
            key={slot.label}
            label={slot.label}
            games={slot.games}
            selectedGameId={selectedGameId}
            dropActive={Boolean(selectedGameId)}
            onSelectGame={onSelectGame}
            onDropHere={onDropHere}
            onReorder={onReorder}
            onRemove={onRemove}
          />
        ))}
      </ScrollView>

      <GamePicker
        visible={pickerOpen}
        excludedGameIds={excluded}
        onClose={() => {
          setPickerOpen(false);
        }}
        onSelect={(game) => {
          const label = board[0]?.label ?? targetLabel;
          setTargetLabel(label);
          const next = addGameToBoard(board, label, {
            gameId: game.gameId,
            title: game.title,
          });
          if (next === 'duplicate') {
            setLocalBanner({
              title: 'Duplicate game',
              description: 'That game is already on this board.',
            });
            return;
          }
          setLocalBanner(null);
          onChange(next);
        }}
      />
    </View>
  );
}

export function toSavePayload(board: EditableTierSlot[]) {
  return boardToSlotsPutPayload(board);
}
