import { Button, ErrorState as UiErrorState } from '@gmrlog/ui';

export interface ProfileErrorStateProps {
  title?: string;
  description?: string;
  isOffline?: boolean;
  onRetry: () => void;
}

export function ProfileErrorState({
  title,
  description,
  isOffline = false,
  onRetry,
}: ProfileErrorStateProps) {
  const resolvedTitle = title ?? (isOffline ? 'You are offline' : 'Could not load profile');
  const resolvedDescription =
    description ??
    (isOffline
      ? 'Reconnect to see your identity and library.'
      : 'Something went wrong loading your profile. Try again.');

  return (
    <UiErrorState
      title={resolvedTitle}
      description={resolvedDescription}
      action={
        <Button variant="secondary" onPress={onRetry} accessibilityLabel="Retry loading profile">
          Retry
        </Button>
      }
    />
  );
}
