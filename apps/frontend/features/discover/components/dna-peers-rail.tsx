import {
  Button,
  EmptyState,
  ErrorState,
  Rail,
  SCREEN_GUTTER,
  Skeleton,
  useTheme,
} from '@gmrlog/ui';
import { View } from 'react-native';

import { useAuthStore } from '../../../src/state/auth-store';
import { useSimilarUsers } from '../hooks/use-discover';

import { DNA_PEER_CARD_WIDTH, DNA_PEER_RING_SIZE, DnaPeerCard } from './dna-peer-card';

export interface DnaPeersRailProps {
  onPressUser: (userId: string) => void;
}

const SKELETON_TILES = 3;

/**
 * "Plays like you" — `README.md` §"Discover", `SCREEN_REDESIGNS.md` §7's first
 * content on the screen. `useSimilarUsers` scoped to the signed-in user's own
 * id (README: "reuse `useSimilarUsers` scoped to the signed-in user") — the
 * same query `similar-users-section.tsx` runs for someone else's profile, just
 * pointed at `self`.
 *
 * No `match.band`/`dimensions` here — those are Phase 5, still unbuilt
 * (`TASKS.md`'s Phase 6 header note). The card only needs `score`, which
 * already exists on every row.
 */
export function DnaPeersRail({ onPressUser }: DnaPeersRailProps) {
  const theme = useTheme();
  const selfId = useAuthStore((s) => s.user?.id);
  const { items, isPending, isError, refetch } = useSimilarUsers(selfId ?? '');

  if (selfId === undefined) {
    return null;
  }

  if (isPending) {
    const gutter = theme.space(SCREEN_GUTTER);
    return (
      <View style={{ gap: theme.space('space.3') }}>
        <View style={{ paddingHorizontal: gutter, gap: theme.space('space.1') }}>
          <Skeleton shape="line" width="35%" height={theme.space('space.3')} />
        </View>
        <View
          style={{ flexDirection: 'row', gap: theme.space('space.3'), paddingHorizontal: gutter }}
        >
          {Array.from({ length: SKELETON_TILES }, (_, index) => (
            <View
              key={`dna-peer-skeleton-${String(index)}`}
              style={{
                width: DNA_PEER_CARD_WIDTH,
                alignItems: 'center',
                gap: theme.space('space.2'),
              }}
            >
              <Skeleton shape="circle" width={DNA_PEER_RING_SIZE} height={DNA_PEER_RING_SIZE} />
              <Skeleton shape="line" width="70%" />
              <Skeleton shape="line" width="50%" />
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <Rail
        title="Plays like you"
        counter="DNA match"
        isEmpty
        emptyState={
          <ErrorState
            title="Could not load matches"
            description="Something went wrong finding players with shared taste."
            action={
              <Button
                variant="secondary"
                onPress={() => {
                  void refetch();
                }}
                accessibilityLabel="Retry loading plays-like-you matches"
              >
                Retry
              </Button>
            }
          />
        }
      >
        {null}
      </Rail>
    );
  }

  if (items.length === 0) {
    return (
      <Rail
        title="Plays like you"
        counter="DNA match"
        isEmpty
        emptyState={
          <EmptyState
            title="No matches yet"
            description="Log more games to surface players who play like you."
          />
        }
      >
        {null}
      </Rail>
    );
  }

  return (
    <Rail title="Plays like you" counter="DNA match">
      {items.map((peer) => (
        <DnaPeerCard key={peer.user.id} peer={peer} onPress={onPressUser} />
      ))}
    </Rail>
  );
}
