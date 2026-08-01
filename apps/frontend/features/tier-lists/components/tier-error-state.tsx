import { Button, ErrorState as UiErrorState } from '@gmrlog/ui';

export interface TierErrorStateProps {
  title?: string;
  description?: string;
  isOffline?: boolean;
  onRetry: () => void;
}

export function TierErrorState({
  title,
  description,
  isOffline = false,
  onRetry,
}: TierErrorStateProps) {
  return (
    <UiErrorState
      title={title ?? (isOffline ? 'You are offline' : 'Could not load tier lists')}
      description={
        description ??
        (isOffline ? 'Reconnect to browse tier lists.' : 'Something went wrong. Try again.')
      }
      action={
        <Button variant="secondary" onPress={onRetry} accessibilityLabel="Retry tier lists">
          Retry
        </Button>
      }
    />
  );
}
