import { Button, ErrorState as UiErrorState } from '@gmrlog/ui';

export interface MessagingErrorStateProps {
  title?: string;
  description?: string;
  isOffline?: boolean;
  onRetry: () => void;
}

export function MessagingErrorState({
  title,
  description,
  isOffline = false,
  onRetry,
}: MessagingErrorStateProps) {
  const resolvedTitle = title ?? (isOffline ? 'You are offline' : 'Could not load messages');
  const resolvedDescription =
    description ??
    (isOffline
      ? 'Reconnect to open your inbox.'
      : 'Something went wrong. Pull to refresh or try again.');

  return (
    <UiErrorState
      title={resolvedTitle}
      description={resolvedDescription}
      action={
        <Button variant="secondary" onPress={onRetry} accessibilityLabel="Retry messaging">
          Retry
        </Button>
      }
    />
  );
}
