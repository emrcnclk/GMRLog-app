import type { DnaDimension, DnaMatchResponse } from '@gmrlog/types';
import {
  ASPECT,
  AspectBox,
  Card,
  Chip,
  CornerNotch,
  EmptyState,
  HIDDEN_FROM_ASSISTIVE_TECH,
  ProgressBar,
  Rail,
  SectionKicker,
  Skeleton,
  Text,
  useTheme,
} from '@gmrlog/ui';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { GmrImage } from '../../../src/assets/gmr-image';
import { useDnaMatch } from '../hooks/use-dna-match';

import { DnaMatchRing } from './dna-match-ring';
import { BAND_LABEL } from './dna-match-token';

export interface DnaMatchPanelProps {
  userId: string;
  displayName: string;
  /** No DNA-match concept against yourself — the panel omits itself. */
  isSelf: boolean;
  /** From `usePublicProfile`'s own relationship read — `getDnaMatch` 404s the
   * whole endpoint on a block either direction, so the caller skips the fetch
   * entirely rather than firing a request that only comes back as an error. */
  isBlocked: boolean;
  onPressGame: (gameId: string) => void;
}

const RING_SIZE = 104;

const DIMENSION_LABEL: Record<DnaDimension['key'], string> = {
  library: 'Shared library',
  genre: 'Genre overlap',
  reviewRating: 'Rating agreement',
  wishlist: 'Wishlist overlap',
  completion: 'Completion style',
};
const DIMENSION_ORDER: DnaDimension['key'][] = [
  'library',
  'genre',
  'reviewRating',
  'wishlist',
  'completion',
];

function PanelShell({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ paddingHorizontal: theme.space('space.4'), paddingTop: theme.space('space.2') }}>
      <Card
        style={{
          borderRadius: theme.radius('radius.xl'),
          borderColor: theme.color('color.accent.muted'),
          overflow: 'hidden',
          gap: theme.space('space.4'),
        }}
      >
        <CornerNotch length={34} />
        <SectionKicker title="Gamer DNA match" />
        {children}
      </Card>
    </View>
  );
}

/**
 * `total` is a weighted sum of the same five components the bars show, so a
 * real percent (`total > 0`) with every component still at `0` cannot happen
 * from a live computation — `computeUserSimilarityBreakdown` always derives
 * both from the same call. `buildDnaMatch` (`similarity.engine.ts`) guards
 * against exactly this shape for `SimilarUserResponse.match`, where it *can*
 * happen (a row cached before the breakdown columns existed). `DnaMatchService`
 * has no such cache path — this branch is therefore unreachable through
 * today's `GET /users/:id/dna-match`, and is kept only so the panel degrades
 * the same way the list token already does if that ever changes, rather than
 * rendering five zero bars as if they meant something.
 */
function breakdownAvailable(match: DnaMatchResponse): boolean {
  return match.percent === 0 || match.dimensions.some((dimension) => dimension.score > 0);
}

function DnaMatchHeader({ match, displayName }: { match: DnaMatchResponse; displayName: string }) {
  const theme = useTheme();
  const bandLabel = BAND_LABEL[match.band];

  return (
    <View style={{ flexDirection: 'row', gap: theme.space('space.4'), alignItems: 'center' }}>
      <View
        accessible
        accessibilityLabel={`${String(match.percent)} percent DNA match with ${displayName}, ${bandLabel.toLowerCase()}`}
        style={{
          width: RING_SIZE,
          height: RING_SIZE,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={{ position: 'absolute' }}>
          <DnaMatchRing percent={match.percent} size={RING_SIZE} />
        </View>
        <Text role="display" {...HIDDEN_FROM_ASSISTIVE_TECH}>
          {match.percent}%
        </Text>
      </View>
      <View style={{ flex: 1, gap: theme.space('space.1') }}>
        <Text role="body" color="color.text.primary">
          {bandLabel}
        </Text>
        <Text role="body" color="color.text.secondary">
          {match.verdict}
        </Text>
      </View>
    </View>
  );
}

function DnaMatchBars({ dimensions }: { dimensions: DnaDimension[] }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.space('space.3') }}>
      {dimensions.map((dimension) => (
        <View key={dimension.key} style={{ gap: theme.space('space.1') }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text role="label">{DIMENSION_LABEL[dimension.key]}</Text>
            <Text role="meta" color="color.text.tertiary">
              {dimension.score}%
            </Text>
          </View>
          <ProgressBar
            value={dimension.score}
            target={100}
            height={2}
            accessibilityLabel={`${DIMENSION_LABEL[dimension.key]}: ${String(dimension.score)} percent`}
          />
        </View>
      ))}
    </View>
  );
}

const SHARED_GAME_WIDTH = 88;

function SharedGamesRail({
  sharedGames,
  onPressGame,
}: {
  sharedGames: DnaMatchResponse['sharedGames'];
  onPressGame: (gameId: string) => void;
}) {
  const theme = useTheme();

  if (sharedGames.length === 0) {
    return null;
  }

  return (
    <Rail title="Both of you played">
      {sharedGames.map((game) => (
        <Pressable
          key={game.id}
          accessibilityRole="button"
          accessibilityLabel={game.title}
          onPress={() => {
            onPressGame(game.id);
          }}
          style={{ width: SHARED_GAME_WIDTH, gap: theme.space('space.1') }}
        >
          <AspectBox ratio="cover">
            <GmrImage
              image={game.coverImage}
              height={Math.round(SHARED_GAME_WIDTH / ASPECT.cover)}
              width="100%"
              // Decorative: the title directly beneath names the game.
              accessibilityLabel={undefined}
            />
          </AspectBox>
          <Text role="metaSm" numberOfLines={1}>
            {game.title}
          </Text>
        </Pressable>
      ))}
    </Rail>
  );
}

/**
 * `README.md` §"DNA match panel" — `GET /users/:id/dna-match` (5.4/5.5)
 * rendered between the identity block and `ProfileStatsGrid`. Four states:
 *
 * 1. **Full** — ring, band, verdict, five bars, trait pills, and (as its own
 *    sibling section below the plate, not nested inside it — `Rail` bleeds
 *    against the screen edge and must not sit inside a padded container) a
 *    "Both of you played" rail.
 * 2. **Breakdown unavailable** — see `breakdownAvailable` above; kept for
 *    parity with the list token, unreachable via this endpoint today.
 * 3. **Too few shared logs** — `applicable && percent === 0`. README calls
 *    for "no fabricated percentage" here, so the ring/percent are not drawn
 *    at all, only an `EmptyState` carrying the backend's own verdict
 *    (`DNA_THIN_DATA_VERDICT`) — truer than the doc's original hardcoded
 *    copy, which predates the backend growing a real sentence for this exact
 *    case.
 * 4. **`applicable: false`** (organisation accounts) — the panel is absent,
 *    not a zero-percent state.
 *
 * Blocked relationships and self-views are gated before the query ever fires
 * (see `DnaMatchPanelProps`).
 */
export function DnaMatchPanel({
  userId,
  displayName,
  isSelf,
  isBlocked,
  onPressGame,
}: DnaMatchPanelProps) {
  const theme = useTheme();
  const dna = useDnaMatch(userId, !isSelf && !isBlocked);

  if (isSelf) {
    return null;
  }

  if (isBlocked) {
    return (
      <PanelShell>
        <Text role="body" color="color.text.tertiary">
          DNA match is unavailable.
        </Text>
      </PanelShell>
    );
  }

  if (dna.isPending) {
    return (
      <PanelShell>
        <View style={{ flexDirection: 'row', gap: theme.space('space.4'), alignItems: 'center' }}>
          <Skeleton shape="circle" width={RING_SIZE} height={RING_SIZE} />
          <View style={{ flex: 1, gap: theme.space('space.2') }}>
            <Skeleton width="50%" />
            <Skeleton width="85%" />
          </View>
        </View>
        <View style={{ gap: theme.space('space.3') }}>
          {DIMENSION_ORDER.map((key) => (
            <Skeleton key={key} height={2} />
          ))}
        </View>
      </PanelShell>
    );
  }

  if (dna.isError || dna.match === null) {
    return null;
  }

  const match = dna.match;

  if (!match.applicable) {
    return null;
  }

  if (match.percent === 0) {
    return (
      <PanelShell>
        <EmptyState title={match.verdict} style={{ padding: 0 }} />
      </PanelShell>
    );
  }

  return (
    <View style={{ gap: theme.space('space.4') }}>
      <PanelShell>
        <DnaMatchHeader match={match} displayName={displayName} />
        {breakdownAvailable(match) ? (
          <DnaMatchBars dimensions={match.dimensions} />
        ) : (
          <Text role="meta" color="color.text.tertiary">
            The breakdown fills in on the next recompute.
          </Text>
        )}
        {match.traits.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space('space.2') }}>
            {match.traits.map((trait) => (
              <Chip key={trait} interactive={false}>
                {trait}
              </Chip>
            ))}
          </View>
        ) : null}
      </PanelShell>
      <SharedGamesRail sharedGames={match.sharedGames} onPressGame={onPressGame} />
    </View>
  );
}
