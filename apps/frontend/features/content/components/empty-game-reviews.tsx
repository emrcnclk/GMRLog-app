import { Button, EmptyState } from '@gmrlog/ui';

export interface EmptyGameReviewsProps {
  onCreate?: () => void;
}

export function EmptyGameReviews({ onCreate }: EmptyGameReviewsProps) {
  return (
    <EmptyState
      icon="star"
      title="No reviews yet"
      description="Be the first to share a thoughtful take on this game."
      fill
      action={
        onCreate ? (
          <Button variant="primary" accessibilityLabel="Write a review" onPress={onCreate}>
            Write a review
          </Button>
        ) : undefined
      }
    />
  );
}
