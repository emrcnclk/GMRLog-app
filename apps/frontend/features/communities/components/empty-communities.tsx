import { Button, EmptyState } from '@gmrlog/ui';

export interface EmptyCommunitiesProps {
  onCreate?: () => void;
  onDiscover?: () => void;
}

export function EmptyCommunities({ onCreate, onDiscover }: EmptyCommunitiesProps) {
  return (
    <EmptyState
      icon="users"
      title="No communities yet"
      description="Create a room for shared taste, or discover communities that already feel like home."
      fill
      action={
        onCreate ? (
          <Button variant="primary" accessibilityLabel="Create community" onPress={onCreate}>
            Create community
          </Button>
        ) : undefined
      }
      secondaryAction={
        onDiscover ? (
          <Button
            variant="secondary"
            accessibilityLabel="Discover communities"
            onPress={onDiscover}
          >
            Discover communities
          </Button>
        ) : undefined
      }
    />
  );
}
