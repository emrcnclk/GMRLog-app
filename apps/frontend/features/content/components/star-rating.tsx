import { Icon, Text, pressableMotionStyle, useReduceMotion, useTheme } from '@gmrlog/ui';
import { Pressable, View } from 'react-native';

import { ratingForStar, starsForRating, REVIEW_STAR_COUNT } from '../hooks/content-model';

export interface StarRatingProps {
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
  error?: string;
}

const STAR_SIZE = 34;

/**
 * §16 — five stars over the constitutional 1–10 rating scale, so each star is
 * worth two points (`ratingForStar`/`starsForRating`, `content-model.ts`).
 * Accent only as a line (the star's stroke), never a filled block, per the
 * accent-is-a-line design law.
 */
export function StarRating({ value, onChange, disabled = false, error }: StarRatingProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const filled = starsForRating(value);
  const stars = Array.from({ length: REVIEW_STAR_COUNT }, (_, index) => index + 1);

  return (
    <View style={{ gap: theme.space('space.2') }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space('space.3') }}>
        <View style={{ flexDirection: 'row' }}>
          {stars.map((star) => {
            const lit = star <= filled;
            return (
              <Pressable
                key={star}
                accessibilityRole="button"
                accessibilityState={{ selected: lit, disabled }}
                aria-selected={lit}
                accessibilityLabel={`Rate ${String(ratingForStar(star))} of 10`}
                disabled={disabled}
                hitSlop={4}
                onPress={() => {
                  onChange(ratingForStar(star));
                }}
                style={({ pressed }) => [
                  {
                    padding: theme.space('space.1'),
                  },
                  pressableMotionStyle(pressed && !disabled, reduceMotion),
                ]}
              >
                <Icon
                  name="star"
                  decorative
                  size={STAR_SIZE}
                  color={lit ? 'color.accent.default' : 'color.border.default'}
                />
              </Pressable>
            );
          })}
        </View>
        {value !== null ? (
          <Text role="meta" color="color.text.secondary">
            {value}/10
          </Text>
        ) : null}
      </View>
      {error ? (
        <Text role="caption" color="color.status.error">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
