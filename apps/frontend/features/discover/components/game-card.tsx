import type { GameCardResponse } from '@gmrlog/types';
import { Text, pressableMotionStyle, useReduceMotion, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { GmrImage } from '../../../src/assets/gmr-image';

export interface GameCardProps {
  game: GameCardResponse;
  onPress: (gameId: string) => void;
}

/**
 * "Result rows: cover, title, meta, rating" (`SCREEN_REDESIGNS.md` §7) — a
 * hairline-separated row, no card/border/radius of its own, matching the
 * app-wide "most lists have no card at all" rule.
 */
function GameCardComponent({ game, onPress }: GameCardProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const coverSize = theme.space('space.16');
  const genreLabel = game.genres
    .slice(0, 2)
    .map((g) => g.name)
    .join(' · ');
  const ratingLabel =
    game.ratingSummary.average !== null
      ? `${game.ratingSummary.average.toFixed(1)} · ${String(game.ratingSummary.count)} reviews`
      : `${String(game.ratingSummary.count)} reviews`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${game.title}. ${genreLabel}. ${ratingLabel}`}
      onPress={() => {
        onPress(game.id);
      }}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          gap: theme.space('space.3'),
          paddingHorizontal: theme.space('space.4'),
          paddingVertical: theme.space('space.3'),
          borderBottomWidth: 1,
          borderBottomColor: theme.color('color.border.default'),
          backgroundColor: theme.color('color.background.primary'),
        },
        pressableMotionStyle(pressed, reduceMotion),
      ]}
    >
      <GmrImage
        image={game.coverImage}
        width={coverSize}
        height={coverSize}
        borderRadius={theme.radius('radius.md')}
        accessibilityLabel={undefined}
      />

      <View style={{ flex: 1, gap: theme.space('space.1'), justifyContent: 'center' }}>
        <Text role="label" color="color.text.primary" numberOfLines={2}>
          {game.title}
        </Text>
        {genreLabel.length > 0 ? (
          <Text role="meta" color="color.text.secondary" numberOfLines={1}>
            {genreLabel}
          </Text>
        ) : null}
        <Text role="caption" color="color.text.tertiary">
          {ratingLabel}
        </Text>
      </View>
    </Pressable>
  );
}

export const GameCard = memo(GameCardComponent);
