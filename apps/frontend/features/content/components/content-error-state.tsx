import { Button, ErrorState as UiErrorState } from '@gmrlog/ui';

export interface ContentErrorStateProps {
  title?: string;
  description?: string;
  isOffline?: boolean;
  onRetry: () => void;
}

export function ContentErrorState({
  title,
  description,
  isOffline = false,
  onRetry,
}: ContentErrorStateProps) {
  const resolvedTitle = title ?? (isOffline ? 'You are offline' : 'Could not load content');
  const resolvedDescription =
    description ??
    (isOffline ? 'Reconnect to load reviews and posts.' : 'Something went wrong. Try again.');

  return (
    <UiErrorState
      title={resolvedTitle}
      description={resolvedDescription}
      action={
        <Button variant="secondary" onPress={onRetry} accessibilityLabel="Retry loading content">
          Retry
        </Button>
      }
    />
  );
}
