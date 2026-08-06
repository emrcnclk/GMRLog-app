import type { SimilarGameResponse } from '@gmrlog/types';
import { Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { View } from 'react-native';

import { GameCard } from './game-card';

const noop = () => {
  // GameCard's onPress is required — a static rendering has nothing to navigate to.
};

export interface SimilarGamesSectionProps {
  items: SimilarGameResponse[];
  isPending: boolean;
  onPressGame?: (gameId: string) => void;
}

function SimilarGamesSectionComponent({ items, isPending, onPressGame }: SimilarGamesSectionProps) {
  const theme = useTheme();

  if (isPending && items.length === 0) {
    return (
      <View style={{ gap: theme.space('space.2') }}>
        <Text role="title" color="color.text.primary">
          You may also like
        </Text>
        <Text role="body" color="color.text.secondary">
          Looking for similar games…
        </Text>
      </View>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <View style={{ gap: theme.space('space.2') }} accessibilityRole="summary">
      <Text role="title" color="color.text.primary">
        You may also like
      </Text>
      <View>
        {items.map((row) => (
          <GameCard key={row.game.id} game={row.game} onPress={onPressGame ?? noop} />
        ))}
      </View>
    </View>
  );
}

export const SimilarGamesSection = memo(SimilarGamesSectionComponent);
