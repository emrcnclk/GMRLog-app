import { Button, EmptyState } from '@gmrlog/ui';

export interface EmptyTierListsProps {
  onCreate?: () => void;
  onDiscover?: () => void;
}

export function EmptyTierLists({ onCreate, onDiscover }: EmptyTierListsProps) {
  return (
    <EmptyState
      icon="list-ordered"
      title="No tier lists yet"
      description="Rank games across S–F when you want a sharper take than a rating can carry."
      fill
      action={
        onCreate ? (
          <Button variant="primary" accessibilityLabel="Create tier list" onPress={onCreate}>
            Create tier list
          </Button>
        ) : undefined
      }
      secondaryAction={
        onDiscover ? (
          <Button variant="secondary" accessibilityLabel="Discover games" onPress={onDiscover}>
            Discover games
          </Button>
        ) : undefined
      }
    />
  );
}
