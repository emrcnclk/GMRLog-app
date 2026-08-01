import { Button, ErrorState as UiErrorState } from '@gmrlog/ui';

export interface SearchErrorStateProps {
  isOffline?: boolean;
  onRetry: () => void;
}

export function SearchErrorState({ isOffline = false, onRetry }: SearchErrorStateProps) {
  return (
    <UiErrorState
      title={isOffline ? 'You are offline' : 'Search failed'}
      description={
        isOffline
          ? 'Reconnect to search games, people, and culture.'
          : 'Something went wrong while searching. Try again.'
      }
      action={
        <Button variant="secondary" onPress={onRetry} accessibilityLabel="Retry search">
          Retry
        </Button>
      }
    />
  );
}
