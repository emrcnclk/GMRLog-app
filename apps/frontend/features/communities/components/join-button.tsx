import type { CommunityResponse } from '@gmrlog/types';
import { Badge, Button, useTheme } from '@gmrlog/ui';
import { View } from 'react-native';

import { isCommunityMember, isCommunityOwner } from '../hooks/community-model';
import { useJoinCommunity, useLeaveCommunity } from '../hooks/use-communities';

export interface JoinButtonProps {
  community: CommunityResponse;
  onError?: (message: string) => void;
}

export function JoinButton({ community, onError }: JoinButtonProps) {
  const theme = useTheme();
  const join = useJoinCommunity(community.id);
  const leave = useLeaveCommunity(community.id);
  const member = isCommunityMember(community);
  const owner = isCommunityOwner(community);
  const busy = join.isPending || leave.isPending;

  if (owner) {
    return (
      <View style={{ flexDirection: 'row', gap: theme.space('space.2'), alignItems: 'center' }}>
        <Badge tone="info">Owner</Badge>
        <Badge tone="success">Joined</Badge>
      </View>
    );
  }

  if (member) {
    return (
      <View style={{ flexDirection: 'row', gap: theme.space('space.2'), alignItems: 'center' }}>
        <Badge tone="success">Joined</Badge>
        <Button
          variant="secondary"
          size="sm"
          accessibilityLabel="Leave community"
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
      accessibilityLabel="Join community"
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
      Join
    </Button>
  );
}
