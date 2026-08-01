import { Button, ErrorState as UiErrorState } from '@gmrlog/ui';

export interface EventErrorStateProps {
  title?: string;
  description?: string;
  isOffline?: boolean;
  onRetry: () => void;
}

export function EventErrorState({
  title,
  description,
  isOffline = false,
  onRetry,
}: EventErrorStateProps) {
  const resolvedTitle = title ?? (isOffline ? 'You are offline' : 'Could not load events');
  const resolvedDescription =
    description ?? (isOffline ? 'Reconnect to browse events.' : 'Something went wrong. Try again.');

  return (
    <UiErrorState
      title={resolvedTitle}
      description={resolvedDescription}
      action={
        <Button variant="secondary" onPress={onRetry} accessibilityLabel="Retry events">
          Retry
        </Button>
      }
    />
  );
}
