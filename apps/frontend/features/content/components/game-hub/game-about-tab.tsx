import type { GameMediaResponse, GameResponse } from '@gmrlog/types';
import { AspectBox, Chip, EmptyState, Rail, Skeleton, Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { View } from 'react-native';

import { CachedImage } from '../../../../src/assets/cached-image';
import { formatAttribution } from '../../hooks/game-detail-model';

import { GameVideoList } from './game-media-grid';

export interface GameAboutTabProps {
  game: GameResponse | null;
  screenshots: readonly GameMediaResponse[];
  videos: readonly GameMediaResponse[];
  trailerUrl: string | null;
  isPending: boolean;
  onSeeAllScreenshots: () => void;
  onOpenUrl: (url: string) => void;
}

const SCREENSHOT_RAIL_TILE = 236;
const RAIL_PREVIEW_LIMIT = 8;

/**
 * About (§5) — the "what is this game" tab. Everything here comes from the
 * D3.25 catalog; sections disappear entirely when the catalog has no data for
 * them rather than rendering an empty shell. Screenshots and Videos fold in
 * here rather than staying standalone tabs — §5 names five tabs and neither
 * is one of them, and both are real content the doc never asks to remove.
 * "Add to the conversation" moved out: both real actions (review, post) now
 * live in the hero's persistent action row instead of duplicating here.
 */
function GameAboutTabComponent({
  game,
  screenshots,
  videos,
  trailerUrl,
  isPending,
  onSeeAllScreenshots,
  onOpenUrl,
}: GameAboutTabProps) {
  const theme = useTheme();
  const attribution = formatAttribution(game);
  const blurb = game?.summary ?? game?.description ?? null;

  if (isPending && game === null) {
    return (
      <View style={{ padding: theme.space('space.4'), gap: theme.space('space.3') }}>
        <Skeleton shape="line" width="90%" />
        <Skeleton shape="line" width="75%" />
        <Skeleton shape="line" width="60%" />
        <Skeleton shape="rect" height={theme.space('space.20')} />
      </View>
    );
  }

  return (
    <View style={{ gap: theme.space('space.6'), paddingBottom: theme.space('space.6') }}>
      {blurb !== null ? (
        <View style={{ paddingHorizontal: theme.space('space.4'), gap: theme.space('space.2') }}>
          <Text role="title">About</Text>
          <Text role="body" color="color.text.secondary">
            {blurb}
          </Text>
        </View>
      ) : null}

      {game !== null && game.tags.length > 0 ? (
        <View style={{ paddingHorizontal: theme.space('space.4'), gap: theme.space('space.2') }}>
          <Text role="title">Themes &amp; modes</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space('space.2') }}>
            {game.tags.slice(0, 16).map((tag) => (
              <Chip key={tag.id} interactive={false}>
                {tag.name}
              </Chip>
            ))}
          </View>
        </View>
      ) : null}

      {screenshots.length > 0 ? (
        <Rail
          title="Screenshots"
          subtitle={`${String(screenshots.length)} in the catalog`}
          actionLabel={screenshots.length > RAIL_PREVIEW_LIMIT ? 'See all' : undefined}
          onPressAction={screenshots.length > RAIL_PREVIEW_LIMIT ? onSeeAllScreenshots : undefined}
        >
          {screenshots.slice(0, RAIL_PREVIEW_LIMIT).map((shot, index) => (
            <AspectBox key={shot.id} ratio="hero" style={{ width: SCREENSHOT_RAIL_TILE }}>
              {shot.url !== null ? (
                <CachedImage
                  source={{ uri: shot.url }}
                  priority={index < 3 ? 'normal' : 'low'}
                  contentFit="cover"
                  accessibilityIgnoresInvertColors
                  accessibilityLabel={`${game?.title ?? 'Game'} screenshot ${String(index + 1)}`}
                  style={{ width: '100%', height: '100%' }}
                />
              ) : null}
            </AspectBox>
          ))}
        </Rail>
      ) : null}

      {videos.length > 0 || (trailerUrl !== null && trailerUrl.length > 0) ? (
        <View style={{ gap: theme.space('space.2') }}>
          <Text role="title" style={{ paddingHorizontal: theme.space('space.4') }}>
            Videos
          </Text>
          <GameVideoList
            items={videos}
            trailerUrl={trailerUrl}
            isPending={false}
            gameTitle={game?.title ?? 'Game'}
            onOpenUrl={onOpenUrl}
          />
        </View>
      ) : null}

      {game !== null && (game.series != null || game.franchise != null) ? (
        <View style={{ paddingHorizontal: theme.space('space.4'), gap: theme.space('space.1') }}>
          <Text role="title">Part of</Text>
          {game.series != null ? (
            <Text role="body" color="color.text.secondary">
              {game.series.name} series
            </Text>
          ) : null}
          {game.franchise != null ? (
            <Text role="body" color="color.text.secondary">
              {game.franchise.name} franchise
            </Text>
          ) : null}
        </View>
      ) : null}

      {blurb === null && screenshots.length === 0 && videos.length === 0 ? (
        <EmptyState
          title="Catalog details are still arriving"
          description="Artwork and descriptions are mirrored in the background. Community writing below is already live."
        />
      ) : null}

      {attribution !== null ? (
        <View style={{ paddingHorizontal: theme.space('space.4') }}>
          <Text role="meta" color="color.text.tertiary">
            {attribution}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export const GameAboutTab = memo(GameAboutTabComponent);
