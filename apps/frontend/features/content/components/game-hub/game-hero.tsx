import type { GameHubResponse, GameMediaResponse, GameResponse } from '@gmrlog/types';
import {
  ASPECT,
  Badge,
  Button,
  Chip,
  GradientScrim,
  HatchOverlay,
  Icon,
  IconButton,
  MetricStrip,
  Skeleton,
  StatTile,
  Text,
  hexToRgbTriple,
  useTheme,
} from '@gmrlog/ui';
import { Edit3 } from 'lucide-react-native';
import { memo } from 'react';
import { View } from 'react-native';

import { CachedImage } from '../../../../src/assets/cached-image';
import { GmrImage } from '../../../../src/assets/gmr-image';
import {
  COVER_OVERLAP,
  GAME_HUB_HERO_HEIGHT,
  formatCommunityRating,
  formatCompanies,
  formatCriticScore,
  formatReleaseYear,
  LIBRARY_STATUS_LABELS,
  resolveHeroArtwork,
} from '../../hooks/game-detail-model';

export interface GameHeroProps {
  game: GameResponse | null;
  media: readonly GameMediaResponse[];
  hub: GameHubResponse | null;
  isPending: boolean;
  onWriteReview: () => void;
  onWritePost: () => void;
}

const COVER_WIDTH = 108;

/**
 * Game Hub header — the cinematic overlap hero (§5).
 *
 * 330px full-bleed key art (a fixed compositional constant, the same class as
 * `ASPECT`'s own ratios, not a spacing token) under a diagonal hatch and a
 * scrim that fades to `color.background.primary` exactly, so the image seams
 * invisibly into the screen below it. The cover pulls up 74px into the art —
 * the single move §5 calls out as what makes this read as a product page —
 * with the title and studio bottom-aligned beside it. Depth on the cover
 * comes from a mat of the elevated background, not the "heavy drop shadow"
 * the doc asks for: `THEME_MIGRATION.md` §5 already took the shadow
 * dependency out of the system, and this screen keeps that law rather than
 * reintroducing it for one card.
 */
function GameHeroComponent({
  game,
  media,
  hub,
  isPending,
  onWriteReview,
  onWritePost,
}: GameHeroProps) {
  const theme = useTheme();
  const heroUrl = resolveHeroArtwork(game, media);
  const releaseYear = formatReleaseYear(game?.releaseDate ?? null);
  const criticScore = game === null ? null : formatCriticScore(game);
  const communityRating = game === null ? null : formatCommunityRating(game);
  const developers = formatCompanies(game?.developers ?? []);
  const publishers = formatCompanies(game?.publishers ?? []);
  const shelf = game?.library?.status;
  const studioLine = [releaseYear, developers].filter((part) => part !== null).join(' · ');

  return (
    <View>
      <View style={{ height: GAME_HUB_HERO_HEIGHT, overflow: 'hidden' }}>
        {heroUrl !== null ? (
          <CachedImage
            source={{ uri: heroUrl }}
            priority="high"
            contentFit="cover"
            accessibilityIgnoresInvertColors
            // Decorative: the title beneath already names the game.
            accessibilityElementsHidden
            style={{ width: '100%', height: '100%' }}
          />
        ) : null}
        <HatchOverlay opacity={0.045} />
        <GradientScrim
          direction="to-top"
          intensity={1}
          rgb={hexToRgbTriple(theme.color('color.background.primary'))}
        />
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: theme.space('space.4'),
          paddingHorizontal: theme.space('space.4'),
          marginTop: -COVER_OVERLAP,
        }}
      >
        {/* The cover overlaps the hero, so it needs to sit above the artwork
            rather than in it. Depth comes from a mat of the elevated background
            around the frame — surface lightness, the way §5 asks for it — not
            from the shadow.lg this used to cast. */}
        <View
          style={{
            padding: theme.space('space.1'),
            borderRadius: theme.radius('radius.xl'),
            backgroundColor: theme.color('color.background.elevated'),
          }}
        >
          <View
            style={{
              width: COVER_WIDTH,
              borderRadius: theme.radius('radius.lg'),
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: theme.color('color.border.default'),
            }}
          >
            {/* D3.26 responsive projection: BlurHash holds the space, then the
                WebP variant crossfades in. `coverImage` is null until the media
                pipeline has processed the asset, in which case GmrImage renders
                its own placeholder surface rather than a broken frame. */}
            <GmrImage
              image={game?.coverImage ?? null}
              width={COVER_WIDTH}
              height={Math.round(COVER_WIDTH / ASPECT.cover)}
              priority="high"
              accessibilityLabel={game === null ? undefined : `${game.title} cover art`}
            />
          </View>
        </View>

        <View
          style={{ flex: 1, gap: theme.space('space.2'), paddingBottom: theme.space('space.2') }}
        >
          {shelf !== undefined ? <Badge tone="info">{LIBRARY_STATUS_LABELS[shelf]}</Badge> : null}
          {isPending && game === null ? (
            <Skeleton shape="line" width="80%" height={theme.space('space.6')} />
          ) : (
            <Text role="heading" numberOfLines={3}>
              {game?.title ?? 'Unknown game'}
            </Text>
          )}
          {studioLine.length > 0 ? (
            <Text role="meta" color="color.text.tertiary">
              {studioLine}
            </Text>
          ) : null}
        </View>
      </View>

      <View
        style={{
          paddingHorizontal: theme.space('space.4'),
          paddingTop: theme.space('space.4'),
          gap: theme.space('space.4'),
        }}
      >
        <GameMetricStrip
          communityRating={communityRating}
          communityCount={game?.stats?.ratingCount ?? 0}
          criticScore={criticScore}
          criticCount={game?.externalRatingCount ?? null}
          players={hub?.tabCounts.players ?? null}
          libraryCount={game?.stats?.libraryCount ?? 0}
        />

        {game !== null && game.platforms.length > 0 ? (
          <ChipRow label="Platforms" values={game.platforms.map((platform) => platform.name)} />
        ) : null}

        {game !== null && game.genres.length > 0 ? (
          <ChipRow label="Genres" values={game.genres.map((genre) => genre.name)} />
        ) : null}

        {publishers !== null ? (
          <Text role="meta" color="color.text.tertiary">
            Published by {publishers}
          </Text>
        ) : null}

        <View style={{ flexDirection: 'row', gap: theme.space('space.2') }}>
          <Button
            variant="accent"
            icon={<Edit3 size={16} color={theme.color('color.accent.default')} />}
            onPress={onWriteReview}
            style={{ flex: 1 }}
          >
            Log &amp; review
          </Button>
          <IconButton
            accessibilityLabel="Write a post"
            variant="secondary"
            size="lg"
            onPress={onWritePost}
          >
            <Icon name="message-square" decorative size={20} color="color.text.primary" />
          </IconButton>
        </View>
      </View>
    </View>
  );
}

interface GameMetricStripProps {
  communityRating: string | null;
  communityCount: number;
  criticScore: string | null;
  criticCount: number | null;
  /** `GameHubResponse.tabCounts.players` — real, but not a live concurrent count. */
  players: number | null;
  libraryCount: number;
}

/**
 * §5 asks for "Rating / Hours / Players". Hours has no backing field anywhere
 * on `GameResponse`, `GameStatsProjection` or `GameHubResponse` — no per-game
 * playtime aggregate exists, only per-*user* lifetime stats elsewhere in the
 * app. Built from what's real instead: community rating, critic score when
 * the catalog has one, the Players tab's real count, and library count.
 */
function GameMetricStrip({
  communityRating,
  communityCount,
  criticScore,
  criticCount,
  players,
  libraryCount,
}: GameMetricStripProps) {
  const cells: { key: string; value: string; label: string }[] = [];
  if (communityRating !== null) {
    cells.push({
      key: 'rating',
      value: communityRating,
      label: communityCount > 0 ? `Rating (${String(communityCount)})` : 'Rating',
    });
  }
  if (criticScore !== null) {
    cells.push({
      key: 'critic',
      value: criticScore,
      label:
        criticCount != null && criticCount > 0 ? `Critics (${String(criticCount)})` : 'Critics',
    });
  }
  if (players !== null) {
    cells.push({ key: 'players', value: String(players), label: 'Players' });
  }
  if (libraryCount > 0) {
    cells.push({ key: 'library', value: String(libraryCount), label: 'In library' });
  }

  if (cells.length === 0) {
    return null;
  }

  return (
    <MetricStrip accessibilityLabel="Game facts">
      {cells.map((cell) => (
        <StatTile key={cell.key} value={cell.value} label={cell.label} />
      ))}
    </MetricStrip>
  );
}

function ChipRow({ label, values }: { label: string; values: readonly string[] }) {
  const theme = useTheme();

  return (
    <View
      accessibilityLabel={`${label}: ${values.join(', ')}`}
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space('space.2') }}
    >
      {values.map((value) => (
        <Chip key={value} interactive={false}>
          {value}
        </Chip>
      ))}
    </View>
  );
}

export const GameHero = memo(GameHeroComponent);
