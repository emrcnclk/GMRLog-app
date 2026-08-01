import { Button, EmptyState } from '@gmrlog/ui';
import { useRouter } from 'expo-router';

/**
 * An empty attention desk is a good state, not a failure — so this says so, and
 * points somewhere worth going rather than asking the reader to wait.
 */
export function EmptyNotifications() {
  const router = useRouter();

  return (
    <EmptyState
      icon="bell"
      title="You are all caught up"
      description="Likes, comments, follows, and achievements land here. Nothing is waiting on you right now."
      fill
      action={
        <Button
          variant="secondary"
          accessibilityLabel="Find people to follow"
          onPress={() => {
            router.push('/(app)/friends');
          }}
        >
          Find people to follow
        </Button>
      }
    />
  );
}
