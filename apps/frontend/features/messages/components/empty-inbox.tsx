import { Button, EmptyState } from '@gmrlog/ui';

export interface EmptyInboxProps {
  onNewConversation: () => void;
}

export function EmptyInbox({ onNewConversation }: EmptyInboxProps) {
  return (
    <EmptyState
      icon="message-square"
      title="No conversations yet"
      description="Start a conversation when you want a quieter place to talk about games."
      fill
      action={
        <Button variant="primary" accessibilityLabel="New conversation" onPress={onNewConversation}>
          New conversation
        </Button>
      }
    />
  );
}
