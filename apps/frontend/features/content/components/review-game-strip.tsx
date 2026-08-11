import { Skeleton, Text, useTheme } from '@gmrlog/ui';
import { View } from 'react-native';

import { GmrImage } from '../../../src/assets/gmr-image';
import { useGameDetail } from '../hooks/use-game-detail';

export interface ReviewGameStripProps {
  gameId: string;
}

const COVER_WIDTH = 52;
const COVER_HEIGHT = 70;

/** §16's game strip. Errors fall back to nothing — the composer itself still works without it. */
export function ReviewGameStrip({ gameId }: ReviewGameStripProps) {
  const theme = useTheme();
  const { game, isPending, isError } = useGameDetail(gameId);

  if (isError) {
    return null;
  }

  if (isPending || game === null) {
    return (
      <View style={{ flexDirection: 'row', gap: theme.space('space.3') }}>
        <Skeleton shape="rect" width={COVER_WIDTH} height={COVER_HEIGHT} />
        <View style={{ gap: theme.space('space.2'), justifyContent: 'center' }}>
          <Skeleton shape="line" width={140} />
          <Skeleton shape="line" width={80} />
        </View>
      </View>
    );
  }

  const platformLabel = game.platforms.map((platform) => platform.name).join(' · ');

  return (
    <View style={{ flexDirection: 'row', gap: theme.space('space.3') }}>
      <GmrImage
        image={game.coverImage}
        width={COVER_WIDTH}
        height={COVER_HEIGHT}
        borderRadius={theme.radius('radius.sm')}
        accessibilityLabel={undefined}
      />
      <View style={{ gap: theme.space('space.1'), justifyContent: 'center' }}>
        <Text role="headline" color="color.text.primary" numberOfLines={2}>
          {game.title}
        </Text>
        {platformLabel.length > 0 ? (
          <Text role="meta" color="color.text.tertiary">
            {platformLabel}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
