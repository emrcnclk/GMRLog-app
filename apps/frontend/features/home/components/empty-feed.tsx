import { Button, EmptyState } from '@gmrlog/ui';

export interface EmptyFeedProps {
  onDiscover: () => void;
}

/**
 * Empty activity center — calm CTA toward Discover (no FOMO).
 */
export function EmptyFeed({ onDiscover }: EmptyFeedProps) {
  return (
    <EmptyState
      icon="compass"
      title="Your feed is quiet"
      description="When friends review, log, and collect, their culture shows up here."
      fill
      action={
        <Button onPress={onDiscover} accessibilityLabel="Discover games">
          Discover games
        </Button>
      }
    />
  );
}
