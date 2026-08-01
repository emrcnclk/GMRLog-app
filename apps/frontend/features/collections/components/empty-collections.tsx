import { Button, EmptyState } from '@gmrlog/ui';

export interface EmptyCollectionsProps {
  onCreate?: () => void;
  onDiscover?: () => void;
}

export function EmptyCollections({ onCreate, onDiscover }: EmptyCollectionsProps) {
  return (
    <EmptyState
      icon="folder"
      title="No collections yet"
      description="Gather games into curated sets that reflect your taste — a shelf says more than a rating."
      fill
      action={
        onCreate ? (
          <Button variant="primary" accessibilityLabel="Create collection" onPress={onCreate}>
            Create collection
          </Button>
        ) : undefined
      }
      secondaryAction={
        onDiscover ? (
          <Button
            variant="secondary"
            accessibilityLabel="Discover collections"
            onPress={onDiscover}
          >
            Browse collections
          </Button>
        ) : undefined
      }
    />
  );
}
