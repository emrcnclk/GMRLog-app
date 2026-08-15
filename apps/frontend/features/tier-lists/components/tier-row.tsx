import { Text, useTheme } from '@gmrlog/ui';
import { GripVertical } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import type { EditableTierGame } from '../hooks/tier-list-model';

export interface TierGameChipProps {
  game: EditableTierGame;
  selected?: boolean;
  onPress: (gameId: string) => void;
  onLongPress?: (gameId: string) => void;
}

function TierGameChipComponent({
  game,
  selected = false,
  onPress,
  onLongPress,
}: TierGameChipProps) {
  const theme = useTheme();
  const hit = theme.space('space.12');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      aria-selected={selected}
      accessibilityLabel={`${game.title}${selected ? ', selected for drag' : ''}`}
      onPress={() => {
        onPress(game.gameId);
      }}
      onLongPress={() => {
        onLongPress?.(game.gameId);
      }}
      delayLongPress={180}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space('space.1'),
        minHeight: hit,
        paddingHorizontal: theme.space('space.3'),
        borderRadius: theme.radius('radius.md'),
        borderWidth: 1,
        borderColor: selected
          ? theme.color('color.interactive.primary')
          : theme.color('color.border.default'),
        backgroundColor: selected
          ? theme.color('color.surface.secondary')
          : theme.color('color.background.primary'),
      }}
    >
      <GripVertical size={14} color={theme.color('color.text.tertiary')} strokeWidth={1.75} />
      <Text role="label" color="color.text.primary" numberOfLines={1}>
        {game.title}
      </Text>
    </Pressable>
  );
}

export const TierGameChip = memo(TierGameChipComponent);

export interface TierRowProps {
  label: string;
  games: EditableTierGame[];
  selectedGameId: string | null;
  dropActive?: boolean;
  onSelectGame: (gameId: string) => void;
  onDropHere: (label: string) => void;
  onReorder: (label: string, fromIndex: number, toIndex: number) => void;
  onRemove: (gameId: string) => void;
}

function TierRowComponent({
  label,
  games,
  selectedGameId,
  dropActive = false,
  onSelectGame,
  onDropHere,
  onReorder,
  onRemove,
}: TierRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Tier ${label}${dropActive ? ', drop target' : ''}`}
      onPress={() => {
        if (selectedGameId) {
          onDropHere(label);
        }
      }}
      style={{
        borderBottomWidth: 1,
        borderBottomColor: theme.color('color.border.default'),
        backgroundColor: dropActive
          ? theme.color('color.surface.secondary')
          : theme.color('color.background.primary'),
        minHeight: theme.space('space.16'),
        paddingVertical: theme.space('space.3'),
        paddingHorizontal: theme.space('space.4'),
        gap: theme.space('space.2'),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space('space.3') }}>
        <View
          style={{
            width: theme.space('space.10'),
            height: theme.space('space.10'),
            borderRadius: theme.radius('radius.md'),
            backgroundColor: theme.color('color.surface.secondary'),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text role="label" color="color.text.primary">
            {label}
          </Text>
        </View>
        <Text role="meta" color="color.text.tertiary" style={{ flex: 1 }}>
          {games.length === 0
            ? selectedGameId
              ? 'Drop here'
              : 'Empty'
            : `${String(games.length)} games`}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space('space.2') }}>
        {games.map((game, index) => (
          <View key={game.gameId} style={{ gap: theme.space('space.1') }}>
            <TierGameChip
              game={game}
              selected={selectedGameId === game.gameId}
              onPress={onSelectGame}
              onLongPress={onSelectGame}
            />
            {selectedGameId === game.gameId ? (
              <View style={{ flexDirection: 'row', gap: theme.space('space.1') }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Move ${game.title} left`}
                  onPress={() => {
                    onReorder(label, index, index - 1);
                  }}
                  style={{ minHeight: theme.space('space.8'), justifyContent: 'center' }}
                >
                  <Text role="caption" color="color.interactive.primary">
                    Left
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Move ${game.title} right`}
                  onPress={() => {
                    onReorder(label, index, index + 1);
                  }}
                  style={{ minHeight: theme.space('space.8'), justifyContent: 'center' }}
                >
                  <Text role="caption" color="color.interactive.primary">
                    Right
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${game.title}`}
                  onPress={() => {
                    onRemove(game.gameId);
                  }}
                  style={{ minHeight: theme.space('space.8'), justifyContent: 'center' }}
                >
                  <Text role="caption" color="color.text.secondary">
                    Remove
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ))}
      </View>
    </Pressable>
  );
}

export const TierRow = memo(TierRowComponent);
