import { Button, ErrorState as UiErrorState } from '@gmrlog/ui';

export interface NotificationErrorStateProps {
  title?: string;
  description?: string;
  isOffline?: boolean;
  onRetry: () => void;
}

export function NotificationErrorState({
  title,
  description,
  isOffline = false,
  onRetry,
}: NotificationErrorStateProps) {
  const resolvedTitle = title ?? (isOffline ? 'You are offline' : 'Could not load notifications');
  const resolvedDescription =
    description ??
    (isOffline ? 'Reconnect to refresh your attention desk.' : 'Something went wrong. Try again.');

  return (
    <UiErrorState
      title={resolvedTitle}
      description={resolvedDescription}
      action={
        <Button variant="secondary" onPress={onRetry} accessibilityLabel="Retry notifications">
          Retry
        </Button>
      }
    />
  );
}
