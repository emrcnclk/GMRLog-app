import { Button, ErrorState as UiErrorState } from '@gmrlog/ui';

export interface CommunityErrorStateProps {
  title?: string;
  description?: string;
  isOffline?: boolean;
  onRetry: () => void;
}

export function CommunityErrorState({
  title,
  description,
  isOffline = false,
  onRetry,
}: CommunityErrorStateProps) {
  const resolvedTitle = title ?? (isOffline ? 'You are offline' : 'Could not load communities');
  const resolvedDescription =
    description ??
    (isOffline ? 'Reconnect to browse communities.' : 'Something went wrong. Try again.');

  return (
    <UiErrorState
      title={resolvedTitle}
      description={resolvedDescription}
      action={
        <Button variant="secondary" onPress={onRetry} accessibilityLabel="Retry communities">
          Retry
        </Button>
      }
    />
  );
}
