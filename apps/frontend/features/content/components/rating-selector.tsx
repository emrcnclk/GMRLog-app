import { Text, useTheme } from '@gmrlog/ui';
import { Pressable, View } from 'react-native';

import { REVIEW_RATING_MAX, REVIEW_RATING_MIN } from '../hooks/content-model';

export interface RatingSelectorProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  error?: string;
}

export function RatingSelector({ value, onChange, disabled = false, error }: RatingSelectorProps) {
  const theme = useTheme();
  const hit = theme.space('space.12');
  const ratings = Array.from(
    { length: REVIEW_RATING_MAX - REVIEW_RATING_MIN + 1 },
    (_, index) => REVIEW_RATING_MIN + index,
  );

  return (
    <View style={{ gap: theme.space('space.2') }}>
      <Text role="label" color="color.text.secondary">
        Rating
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space('space.2') }}>
        {ratings.map((rating) => {
          const selected = rating === value;
          return (
            <Pressable
              key={rating}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled }}
              accessibilityLabel={`Rating ${String(rating)} of ${String(REVIEW_RATING_MAX)}`}
              disabled={disabled}
              onPress={() => {
                onChange(rating);
              }}
              style={{
                minWidth: hit,
                minHeight: hit,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: theme.radius('radius.md'),
                borderWidth: 1,
                borderColor: selected
                  ? theme.color('color.interactive.primary')
                  : theme.color('color.border.default'),
                backgroundColor: selected
                  ? theme.color('color.interactive.primary')
                  : theme.color('color.surface.secondary'),
              }}
            >
              <Text role="label" color={selected ? 'color.text.inverse' : 'color.text.primary'}>
                {String(rating)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <Text role="caption" color="color.status.error">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
