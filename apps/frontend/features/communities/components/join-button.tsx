import type { CommunityResponse } from '@gmrlog/types';
import { Button, Text } from '@gmrlog/ui';

import { isCommunityMember, isCommunityOwner } from '../hooks/community-model';
import { useJoinCommunity, useLeaveCommunity } from '../hooks/use-communities';

export interface JoinButtonProps {
  community: CommunityResponse;
  onError?: (message: string) => void;
}

/**
 * `SCREEN_REDESIGNS_2.md` §14 — "outlined accent when not a member, plain
 * hairline 'Joined' when a member".
 *
 * Both halves changed. Joining was a **filled** primary button; it is now the
 * outlined accent §14 asks for, which is also the treatment the design law
 * prefers for a CTA. Membership was a `Badge tone="success"` beside a "Leave"
 * button — a filled chip, the exact thing §13 rules out ("not a badge, not a
 * filled chip") and §14 restates. It is now one hairline control reading
 * "Joined" that leaves when pressed, so the state and its only action are the
 * same target instead of two.
 *
 * **The owner gets a fact, not a control.** They cannot leave their own circle,
 * so offering "Joined" would offer an action that fails; their actions (edit,
 * delete) live behind §14's overflow button. A monospace line is where
 * CLAUDE.md puts a status.
 */
export function JoinButton({ community, onError }: JoinButtonProps) {
  const join = useJoinCommunity(community.id);
  const leave = useLeaveCommunity(community.id);
  const member = isCommunityMember(community);
  const owner = isCommunityOwner(community);
  const busy = join.isPending || leave.isPending;

  if (owner) {
    return (
      <Text role="meta" color="color.text.tertiary">
        Owner
      </Text>
    );
  }

  if (member) {
    return (
      <Button
        variant="secondary"
        // The label carries the action the visible word does not: RNW drops
        // `accessibilityState`, so nothing else announces that this leaves.
        accessibilityLabel="Joined. Leave community"
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
        Joined
      </Button>
    );
  }

  return (
    <Button
      variant="accent"
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
