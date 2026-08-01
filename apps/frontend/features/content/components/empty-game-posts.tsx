import { Button, EmptyState } from '@gmrlog/ui';

export interface EmptyGamePostsProps {
  onCreate?: () => void;
}

export function EmptyGamePosts({ onCreate }: EmptyGamePostsProps) {
  return (
    <EmptyState
      icon="message-square"
      title="No posts yet"
      description="Start a conversation about this game — a question, a screenshot, or a hot take all count."
      fill
      action={
        onCreate ? (
          <Button variant="primary" accessibilityLabel="Write a post" onPress={onCreate}>
            Write a post
          </Button>
        ) : undefined
      }
    />
  );
}
