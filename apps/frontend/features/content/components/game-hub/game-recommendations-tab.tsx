import type { GameRelatedGameResponse, SimilarGameResponse } from '@gmrlog/types';
import { AspectBox, Badge, EmptyState, Rail, Skeleton, Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { CachedImage } from '../../../../src/assets/cached-image';

export interface GameRecommendationsTabProps {
  related: readonly GameRelatedGameResponse[];
  similar: readonly SimilarGameResponse[];
  isPending: boolean;
  onPressGame: (gameId: string) => void;
}

const TILE_WIDTH = 132;

const RELATION_LABELS: Record<GameRelatedGameResponse['kind'], string> = {
  similar: 'Similar',
  dlc: 'DLC',
  expansion: 'Expansion',
  remake: 'Remake',
  remaster: 'Remaster',
  prequel: 'Prequel',
  sequel: 'Sequel',
};

/**
 * Two distinct recommendation sources, kept visually separate because they mean
 * different things: `related` is the publisher's own declared relationship
 * (D3.25 provider data), `similar` is GMRLOG's behavioural similarity engine.
 */
function GameRecommendationsTabComponent({
  related,
  similar,
  isPending,
  onPressGame,
}: GameRecommendationsTabProps) {
  const theme = useTheme();

  // Provider entries the catalog has not ingested yet carry no id and cannot be
  // opened — group them separately rather than rendering dead tiles.
  const linkedRelated = related.filter((item) => item.gameId !== null);
  const unlinkedRelated = related.filter((item) => item.gameId === null);

  const byRelation = new Map<GameRelatedGameResponse['kind'], GameRelatedGameResponse[]>();
  for (const item of linkedRelated) {
    const bucket = byRelation.get(item.kind) ?? [];
    bucket.push(item);
    byRelation.set(item.kind, bucket);
  }

  if (isPending && related.length === 0 && similar.length === 0) {
    return (
      <View
        style={{
          padding: theme.space('space.4'),
          flexDirection: 'row',
          gap: theme.space('space.3'),
        }}
      >
        {Array.from({ length: 3 }, (_, index) => (
          <View
            key={`rec-skeleton-${String(index)}`}
            style={{ width: TILE_WIDTH, gap: theme.space('space.2') }}
          >
            <Skeleton shape="rect" height={TILE_WIDTH / (3 / 4)} />
            <Skeleton shape="line" width="80%" />
          </View>
        ))}
      </View>
    );
  }

  if (related.length === 0 && similar.length === 0) {
    return (
      <EmptyState
        title="No recommendations yet"
        description="Related titles appear once the catalog finishes enriching this game, or once enough players share it with others."
      />
    );
  }

  return (
    <View style={{ gap: theme.space('space.6'), paddingBottom: theme.space('space.6') }}>
      {[...byRelation.entries()].map(([kind, items]) => (
        <Rail key={kind} title={RELATION_LABELS[kind]} subtitle="From the publisher's catalog">
          {items.map((item) => {
            // Bind the id locally so the closure captures a narrowed `string`.
            const gameId = item.gameId;
            return (
              <GameTile
                key={`${kind}-${gameId ?? item.title ?? ''}`}
                title={item.title ?? 'Untitled'}
                coverUrl={item.coverImageUrl}
                onPress={
                  gameId === null
                    ? undefined
                    : () => {
                        onPressGame(gameId);
                      }
                }
              />
            );
          })}
        </Rail>
      ))}

      {similar.length > 0 ? (
        <Rail title="Players also like" subtitle="Based on shared libraries and ratings">
          {similar.map((row) => (
            <GameTile
              key={row.game.id}
              title={row.game.title}
              coverUrl={row.game.coverImageUrl}
              onPress={() => {
                onPressGame(row.game.id);
              }}
            />
          ))}
        </Rail>
      ) : null}

      {unlinkedRelated.length > 0 ? (
        <View style={{ paddingHorizontal: theme.space('space.4'), gap: theme.space('space.2') }}>
          <Text role="title">Also in this series</Text>
          <Text role="meta" color="color.text.tertiary">
            Not in the GMRLOG catalog yet.
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space('space.2') }}>
            {unlinkedRelated.map((item) => (
              <Badge key={item.title ?? item.slug ?? ''} tone="neutral">
                {item.title ?? 'Untitled'}
              </Badge>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

interface GameTileProps {
  title: string;
  coverUrl: string | null;
  onPress?: () => void;
}

/** Portrait cover tile — the shared shape for every game rail in the app. */
export function GameTile({ title, coverUrl, onPress }: GameTileProps) {
  const theme = useTheme();

  const content = (
    <View style={{ width: TILE_WIDTH, gap: theme.space('space.2') }}>
      <AspectBox ratio="cover">
        {coverUrl !== null && coverUrl.length > 0 ? (
          <CachedImage
            source={{ uri: coverUrl }}
            priority="low"
            contentFit="cover"
            accessibilityIgnoresInvertColors
            style={{ width: '100%', height: '100%' }}
          />
        ) : null}
      </AspectBox>
      <Text role="label" numberOfLines={2}>
        {title}
      </Text>
    </View>
  );

  if (onPress === undefined) {
    return content;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${title}`}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      {content}
    </Pressable>
  );
}

export const GameRecommendationsTab = memo(GameRecommendationsTabComponent);
