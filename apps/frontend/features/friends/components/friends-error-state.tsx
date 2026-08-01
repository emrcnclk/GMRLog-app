import { Button, ErrorState as UiErrorState } from '@gmrlog/ui';

export interface FriendsErrorStateProps {
  title?: string;
  description?: string;
  isOffline?: boolean;
  onRetry: () => void;
}

export function FriendsErrorState({
  title,
  description,
  isOffline = false,
  onRetry,
}: FriendsErrorStateProps) {
  const resolvedTitle = title ?? (isOffline ? 'You are offline' : 'Could not load friends');
  const resolvedDescription =
    description ??
    (isOffline ? 'Reconnect to refresh your friends list.' : 'Something went wrong. Try again.');

  return (
    <UiErrorState
      title={resolvedTitle}
      description={resolvedDescription}
      action={
        <Button variant="secondary" onPress={onRetry} accessibilityLabel="Retry friends">
          Retry
        </Button>
      }
    />
  );
}
