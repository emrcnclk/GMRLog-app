import { Button, ErrorState as UiErrorState } from '@gmrlog/ui';
import { memo } from 'react';

export interface SettingsErrorStateProps {
  title?: string;
  description?: string;
  isOffline?: boolean;
  onRetry: () => void;
}

function SettingsErrorStateComponent({
  title,
  description,
  isOffline = false,
  onRetry,
}: SettingsErrorStateProps) {
  const resolvedTitle = title ?? (isOffline ? 'You are offline' : 'Could not load settings');
  const resolvedDescription =
    description ?? (isOffline ? 'Reconnect to sync settings.' : 'Something went wrong. Try again.');

  return (
    <UiErrorState
      title={resolvedTitle}
      description={resolvedDescription}
      action={
        <Button variant="secondary" onPress={onRetry} accessibilityLabel="Retry settings">
          Retry
        </Button>
      }
    />
  );
}

export const SettingsErrorState = memo(SettingsErrorStateComponent);
