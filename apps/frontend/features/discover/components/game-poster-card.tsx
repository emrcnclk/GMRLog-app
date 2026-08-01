import type { GameCardResponse } from '@gmrlog/types';
import {
  ASPECT,
  AspectBox,
  Text,
  pressableMotionStyle,
  useReduceMotion,
  useTheme,
} from '@gmrlog/ui';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { GmrImage } from '../../../src/assets/gmr-image';

export interface GamePosterCardProps {
  game: GameCardResponse;
  onPress: (gameId: string) => void;
  /** Above-the-fold tiles fetch eagerly; the rest wait their turn. */
  priority?: 'high' | 'normal' | 'low';
  width?: number;
}

/** Portrait cover, sized so three sit across a phone with room to breathe. */
export const POSTER_WIDTH = 132;

/**
 * The Discover tile: artwork first, words second.
 *
 * Discover's job is to make a game look worth opening, and a 64px thumbnail in
 * a bordered row cannot do that — it reads as a settings entry. The cover gets
 * the whole tile, height is reserved by `AspectBox` before the image resolves,
 * and the BlurHash carries the space until the WebP variant lands.
 *
 * Metadata is deliberately thin. A rail is scanned, not read: title, then one
 * line that earns its place only when the catalog actually has the number.
 */
function GamePosterCardComponent({
  game,
  onPress,
  priority = 'normal',
  width = POSTER_WIDTH,
}: GamePosterCardProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();

  const rating =
    game.ratingSummary.average !== null && game.ratingSummary.count > 0
      ? game.ratingSummary.average.toFixed(1)
      : null;
  const year =
    game.releaseDate !== null && game.releaseDate.length >= 4 ? game.releaseDate.slice(0, 4) : null;
  const meta = rating !== null ? `★ ${rating}` : year;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        rating !== null
          ? `${game.title}, rated ${rating} out of 10`
          : year !== null
            ? `${game.title}, ${year}`
            : game.title
      }
      onPress={() => {
        onPress(game.id);
      }}
      style={({ pressed }) => [
        { width, gap: theme.space('space.2') },
        pressableMotionStyle(pressed, reduceMotion),
      ]}
    >
      <View
        style={{
          borderRadius: theme.radius('radius.lg'),
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: theme.color('color.border.default'),
        }}
      >
        <AspectBox ratio="cover" radius="radius.none">
          <GmrImage
            image={game.coverImage}
            height={Math.round(width / ASPECT.cover)}
            width="100%"
            priority={priority}
            // Decorative: the title directly beneath names the game.
            accessibilityLabel={undefined}
          />
        </AspectBox>
      </View>

      <View style={{ gap: theme.space('space.1') }}>
        <Text role="label" numberOfLines={2}>
          {game.title}
        </Text>
        {meta !== null ? (
          <Text role="meta" color="color.text.tertiary" numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export const GamePosterCard = memo(GamePosterCardComponent);
