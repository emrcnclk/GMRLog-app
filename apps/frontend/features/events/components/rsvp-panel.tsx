import type { EventResponse } from '@gmrlog/types';
import { Badge, Button, Text, useTheme } from '@gmrlog/ui';
import { View } from 'react-native';

import { RSVP_STATES, rsvpStateLabel, viewerRsvpState } from '../hooks/event-model';
import { useRsvpEvent } from '../hooks/use-events';

export interface RsvpPanelProps {
  event: EventResponse;
  onError?: (message: string) => void;
}

/** D3.24 LFG RSVP — looking_for_team · need_players · hosting · going · interested. */
export function RsvpPanel({ event, onError }: RsvpPanelProps) {
  const theme = useTheme();
  const rsvp = useRsvpEvent(event.id);
  const current = viewerRsvpState(event);

  return (
    <View style={{ gap: theme.space('space.2') }}>
      {current ? (
        <Badge tone="success">{rsvpStateLabel(current)}</Badge>
      ) : (
        <Text role="meta" color="color.text.secondary">
          Choose your RSVP
        </Text>
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space('space.2') }}>
        {RSVP_STATES.map((state) => {
          const selected = current === state;
          return (
            <Button
              key={state}
              variant={selected ? 'primary' : 'secondary'}
              size="sm"
              accessibilityLabel={`RSVP ${rsvpStateLabel(state)}`}
              loading={rsvp.isPending && rsvp.variables === state}
              disabled={rsvp.isPending}
              onPress={() => {
                rsvp.mutate(state, {
                  onError: (error) => {
                    onError?.(error instanceof Error ? error.message : 'Could not update RSVP');
                  },
                });
              }}
            >
              {rsvpStateLabel(state)}
            </Button>
          );
        })}
      </View>
    </View>
  );
}
