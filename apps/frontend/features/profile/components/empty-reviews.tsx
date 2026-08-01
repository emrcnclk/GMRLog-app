import { Button, EmptyState } from '@gmrlog/ui';

export interface EmptyReviewsProps {
  /** The backend has no own-reviews index; the surface says so rather than lying. */
  listUnavailable?: boolean;
  onDiscover?: () => void;
}

export function EmptyReviews({ listUnavailable = false, onDiscover }: EmptyReviewsProps) {
  return (
    <EmptyState
      icon="star"
      title={listUnavailable ? 'Reviews list coming later' : 'No reviews yet'}
      description={
        listUnavailable
          ? 'Your own reviews are reachable from each game until a reviews index ships.'
          : 'Write about a game you finished — a paragraph is enough to be worth reading.'
      }
      fill
      action={
        onDiscover ? (
          <Button variant="secondary" accessibilityLabel="Discover games" onPress={onDiscover}>
            Discover games
          </Button>
        ) : undefined
      }
    />
  );
}
