import type { EventResponse } from '@gmrlog/types';
import { Badge, Button, useTheme } from '@gmrlog/ui';
import { View } from 'react-native';

import { isViewerGoing } from '../hooks/event-model';
import { useJoinEvent, useLeaveEvent } from '../hooks/use-events';

export interface ParticipationButtonProps {
  event: EventResponse;
  onError?: (message: string) => void;
}

export function ParticipationButton({ event, onError }: ParticipationButtonProps) {
  const theme = useTheme();
  const join = useJoinEvent(event.id);
  const leave = useLeaveEvent(event.id);
  const going = isViewerGoing(event);
  const busy = join.isPending || leave.isPending;

  if (going) {
    return (
      <View style={{ flexDirection: 'row', gap: theme.space('space.2'), alignItems: 'center' }}>
        <Badge tone="success">Going</Badge>
        <Button
          variant="secondary"
          size="sm"
          accessibilityLabel="Leave event"
          loading={leave.isPending}
          disabled={busy}
          onPress={() => {
            leave.mutate(undefined, {
              onError: (error) => {
                onError?.(error instanceof Error ? error.message : 'Could not leave');
              },
            });
          }}
        >
          Leave
        </Button>
      </View>
    );
  }

  return (
    <Button
      variant="primary"
      accessibilityLabel="Mark as going"
      loading={join.isPending}
      disabled={busy}
      onPress={() => {
        join.mutate(undefined, {
          onError: (error) => {
            onError?.(error instanceof Error ? error.message : 'Could not join');
          },
        });
      }}
    >
      Going
    </Button>
  );
}
