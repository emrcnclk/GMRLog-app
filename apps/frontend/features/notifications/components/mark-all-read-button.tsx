import { Button } from '@gmrlog/ui';

export interface MarkAllReadButtonProps {
  unreadCount: number;
  loading?: boolean;
  onPress: () => void;
}

export function MarkAllReadButton({
  unreadCount,
  loading = false,
  onPress,
}: MarkAllReadButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      accessibilityLabel={`Mark all ${String(unreadCount)} notifications as read`}
      loading={loading}
      disabled={loading || unreadCount === 0}
      onPress={onPress}
    >
      Mark all read
    </Button>
  );
}
