import { Button, EmptyState } from '@gmrlog/ui';

export interface EmptyLibraryProps {
  onDiscover?: () => void;
}

export function EmptyLibrary({ onDiscover }: EmptyLibraryProps) {
  return (
    <EmptyState
      icon="library"
      title="Your library is empty"
      description="Track games you’re playing, finished, or saving for later — it is what every shelf, stat, and recommendation is built from."
      fill
      action={
        onDiscover ? (
          <Button variant="secondary" accessibilityLabel="Discover games" onPress={onDiscover}>
            Discover games
          </Button>
        ) : undefined
      }
    />
  );
}
