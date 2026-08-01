import type { GameCardResponse } from '@gmrlog/types';
import { Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { View } from 'react-native';

import { GmrImage } from '../../../src/assets/gmr-image';

export interface GameCardProps {
  game: GameCardResponse;
}

function GameCardComponent({ game }: GameCardProps) {
  const theme = useTheme();
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
    <View
      accessibilityRole="summary"
      accessibilityLabel={`${game.title}. ${genreLabel}. ${ratingLabel}`}
      style={{
        flexDirection: 'row',
        gap: theme.space('space.3'),
        paddingHorizontal: theme.space('space.4'),
        paddingVertical: theme.space('space.3'),
        borderBottomWidth: 1,
        borderBottomColor: theme.color('color.border.default'),
        backgroundColor: theme.color('color.background.primary'),
      }}
    >
      <GmrImage
        image={game.coverImage}
        width={coverSize}
        height={coverSize}
        borderRadius={theme.radius('radius.md')}
        accessibilityLabel={`${game.title} cover`}
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
    </View>
  );
}

export const GameCard = memo(GameCardComponent);
