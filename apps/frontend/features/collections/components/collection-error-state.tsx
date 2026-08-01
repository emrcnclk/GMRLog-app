import { Button, ErrorState as UiErrorState } from '@gmrlog/ui';

export interface CollectionErrorStateProps {
  title?: string;
  description?: string;
  isOffline?: boolean;
  onRetry: () => void;
}

export function CollectionErrorState({
  title,
  description,
  isOffline = false,
  onRetry,
}: CollectionErrorStateProps) {
  return (
    <UiErrorState
      title={title ?? (isOffline ? 'You are offline' : 'Could not load collections')}
      description={
        description ??
        (isOffline ? 'Reconnect to browse collections.' : 'Something went wrong. Try again.')
      }
      action={
        <Button variant="secondary" onPress={onRetry} accessibilityLabel="Retry collections">
          Retry
        </Button>
      }
    />
  );
}
