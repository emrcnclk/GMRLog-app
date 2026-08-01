import type { GameMediaResponse, GameResponse } from '@gmrlog/types';
import { AspectBox, Chip, EmptyState, Rail, Skeleton, Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { CachedImage } from '../../../../src/assets/cached-image';
import { formatAttribution } from '../../hooks/game-detail-model';

export interface GameOverviewTabProps {
  game: GameResponse | null;
  screenshots: readonly GameMediaResponse[];
  isPending: boolean;
  onSeeAllScreenshots: () => void;
  onWriteReview: () => void;
  onWritePost: () => void;
}

const SCREENSHOT_RAIL_TILE = 236;
const RAIL_PREVIEW_LIMIT = 8;

/**
 * Overview — the "what is this game" tab. Everything here comes from the D3.25
 * catalog; sections disappear entirely when the catalog has no data for them
 * rather than rendering an empty shell.
 */
function GameOverviewTabComponent({
  game,
  screenshots,
  isPending,
  onSeeAllScreenshots,
  onWriteReview,
  onWritePost,
}: GameOverviewTabProps) {
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

      {game?.series != null || game?.franchise != null ? (
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

      <View style={{ paddingHorizontal: theme.space('space.4'), gap: theme.space('space.2') }}>
        <Text role="title">Add to the conversation</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space('space.2') }}>
          <ActionPill label="Write a review" onPress={onWriteReview} />
          <ActionPill label="Write a post" onPress={onWritePost} />
        </View>
      </View>

      {blurb === null && screenshots.length === 0 ? (
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

function ActionPill({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 44,
        justifyContent: 'center',
        paddingHorizontal: theme.space('space.4'),
        borderRadius: theme.radius('radius.full'),
        backgroundColor: theme.color('color.accent.default'),
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Text role="label" color="color.accent.onAccent">
        {label}
      </Text>
    </Pressable>
  );
}

export const GameOverviewTab = memo(GameOverviewTabComponent);
