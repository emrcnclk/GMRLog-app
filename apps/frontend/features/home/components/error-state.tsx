import { Button, ErrorState as UiErrorState } from '@gmrlog/ui';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  isOffline?: boolean;
  onRetry: () => void;
}

/**
 * Home feed error — offline-aware · retry · no alerts.
 * Composes `@gmrlog/ui` ErrorState.
 */
export function ErrorState({ title, description, isOffline = false, onRetry }: ErrorStateProps) {
  const resolvedTitle = title ?? (isOffline ? 'You are offline' : 'Could not load feed');
  const resolvedDescription =
    description ??
    (isOffline
      ? 'Reconnect to see activity from your digital home.'
      : 'Something went wrong loading activity. Try again.');

  return (
    <UiErrorState
      title={resolvedTitle}
      description={resolvedDescription}
      action={
        <Button variant="secondary" onPress={onRetry} accessibilityLabel="Retry loading feed">
          Retry
        </Button>
      }
    />
  );
}
