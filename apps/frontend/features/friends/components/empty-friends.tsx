import { EmptyState } from '@gmrlog/ui';

export function EmptyFriends() {
  return (
    <EmptyState
      icon="user-plus"
      title="No friends yet"
      description="When someone sends a request or you accept one, your circle gathers here. Pull to refresh anytime."
      fill
    />
  );
}
