import { Button, EmptyState, useTheme } from '@gmrlog/ui';
import { Star } from 'lucide-react-native';
import { View } from 'react-native';

export interface EmptyGameReviewsProps {
  onCreate?: () => void;
}

export function EmptyGameReviews({ onCreate }: EmptyGameReviewsProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.space('space.6'),
        gap: theme.space('space.4'),
      }}
    >
      <View
        accessibilityLabel="Empty reviews illustration"
        style={{
          width: theme.space('space.16'),
          height: theme.space('space.16'),
          borderRadius: theme.radius('radius.full'),
          backgroundColor: theme.color('color.surface.secondary'),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Star size={36} color={theme.color('color.text.secondary')} strokeWidth={1.5} />
      </View>
      <EmptyState
        title="No reviews yet"
        description="Be the first to share a thoughtful take on this game."
      />
      {onCreate ? (
        <Button variant="primary" accessibilityLabel="Write a review" onPress={onCreate}>
          Write a review
        </Button>
      ) : null}
    </View>
  );
}
