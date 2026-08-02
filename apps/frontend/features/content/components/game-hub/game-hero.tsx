import type { GameMediaResponse, GameResponse } from '@gmrlog/types';
import {
  ASPECT,
  AspectBox,
  Badge,
  Chip,
  GradientScrim,
  Skeleton,
  Text,
  useTheme,
} from '@gmrlog/ui';
import { memo } from 'react';
import { View } from 'react-native';

import { CachedImage } from '../../../../src/assets/cached-image';
import { GmrImage } from '../../../../src/assets/gmr-image';
import {
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
  isPending: boolean;
}

const COVER_WIDTH = 108;

/**
 * Game Hub header — hero artwork, scrim, cover, and the identity block
 * (title · year · rating · platforms · genres · studios).
 *
 * Height is reserved by AspectBox before artwork resolves, so the identity block
 * never jumps when the image lands.
 */
function GameHeroComponent({ game, media, isPending }: GameHeroProps) {
  const theme = useTheme();
  const heroUrl = resolveHeroArtwork(game, media);
  const releaseYear = formatReleaseYear(game?.releaseDate ?? null);
  const criticScore = game === null ? null : formatCriticScore(game);
  const communityRating = game === null ? null : formatCommunityRating(game);
  const developers = formatCompanies(game?.developers ?? []);
  const publishers = formatCompanies(game?.publishers ?? []);
  const shelf = game?.library?.status;

  return (
    <View>
      <AspectBox ratio="hero" radius="radius.none">
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
        <GradientScrim direction="to-top" intensity={0.92} />
      </AspectBox>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: theme.space('space.4'),
          paddingHorizontal: theme.space('space.4'),
          // Lift the cover over the hero's lower edge.
          marginTop: -(COVER_WIDTH / ASPECT.cover) / 2.6,
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
        </View>
      </View>

      <View
        style={{
          paddingHorizontal: theme.space('space.4'),
          paddingTop: theme.space('space.3'),
          gap: theme.space('space.3'),
        }}
      >
        <ScoreRow
          releaseYear={releaseYear}
          criticScore={criticScore}
          criticCount={game?.externalRatingCount ?? null}
          communityRating={communityRating}
          communityCount={game?.stats?.ratingCount ?? 0}
          libraryCount={game?.stats?.libraryCount ?? 0}
        />

        {game !== null && game.platforms.length > 0 ? (
          <ChipRow label="Platforms" values={game.platforms.map((platform) => platform.name)} />
        ) : null}

        {game !== null && game.genres.length > 0 ? (
          <ChipRow label="Genres" values={game.genres.map((genre) => genre.name)} />
        ) : null}

        {developers !== null || publishers !== null ? (
          <View style={{ gap: theme.space('space.1') }}>
            {developers !== null ? (
              <Text role="meta" color="color.text.secondary">
                Developed by {developers}
              </Text>
            ) : null}
            {publishers !== null ? (
              <Text role="meta" color="color.text.tertiary">
                Published by {publishers}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

interface ScoreRowProps {
  releaseYear: string | null;
  criticScore: string | null;
  criticCount: number | null;
  communityRating: string | null;
  communityCount: number;
  libraryCount: number;
}

/** Facts row. Each cell renders only when the catalog actually has the number. */
function ScoreRow({
  releaseYear,
  criticScore,
  criticCount,
  communityRating,
  communityCount,
  libraryCount,
}: ScoreRowProps) {
  const theme = useTheme();

  const cells: { key: string; value: string; label: string }[] = [];
  if (releaseYear !== null) {
    cells.push({ key: 'year', value: releaseYear, label: 'Released' });
  }
  if (criticScore !== null) {
    cells.push({
      key: 'critic',
      value: criticScore,
      label:
        criticCount != null && criticCount > 0 ? `Critics (${String(criticCount)})` : 'Critics',
    });
  }
  if (communityRating !== null) {
    cells.push({
      key: 'community',
      value: communityRating,
      label: communityCount > 0 ? `Players (${String(communityCount)})` : 'Players',
    });
  }
  if (libraryCount > 0) {
    cells.push({ key: 'library', value: String(libraryCount), label: 'In libraries' });
  }

  if (cells.length === 0) {
    return null;
  }

  return (
    <View
      accessibilityRole="summary"
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space('space.5') }}
    >
      {cells.map((cell) => (
        <View key={cell.key} style={{ gap: theme.space('space.1') }}>
          <Text role="title">{cell.value}</Text>
          <Text role="meta" color="color.text.tertiary">
            {cell.label}
          </Text>
        </View>
      ))}
    </View>
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
