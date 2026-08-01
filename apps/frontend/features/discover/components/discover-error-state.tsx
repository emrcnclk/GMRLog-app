import { Button, ErrorState as UiErrorState } from '@gmrlog/ui';

export interface DiscoverErrorStateProps {
  title?: string;
  description?: string;
  isOffline?: boolean;
  onRetry: () => void;
}

/** Discover error — offline-aware · retry · no alerts. */
export function DiscoverErrorState({
  title,
  description,
  isOffline = false,
  onRetry,
}: DiscoverErrorStateProps) {
  const resolvedTitle = title ?? (isOffline ? 'You are offline' : 'Could not load Discover');
  const resolvedDescription =
    description ??
    (isOffline
      ? 'Reconnect to browse games, communities, and events.'
      : 'Something went wrong loading Discover. Try again.');

  return (
    <UiErrorState
      title={resolvedTitle}
      description={resolvedDescription}
      action={
        <Button variant="secondary" onPress={onRetry} accessibilityLabel="Retry loading Discover">
          Retry
        </Button>
      }
    />
  );
}
