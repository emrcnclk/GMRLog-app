import type { ReviewResponse } from '@gmrlog/types';
import { Badge, Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { visibilityLabel } from '../hooks/content-model';

import { SpoilerBadge } from './spoiler-badge';

export interface ReviewCardProps {
  review: ReviewResponse;
  onPress: (reviewId: string) => void;
  onPressGame?: (gameId: string) => void;
  onPressEdit?: (reviewId: string) => void;
}

function ReviewCardComponent({ review, onPress, onPressGame, onPressEdit }: ReviewCardProps) {
  const theme = useTheme();
  const gameTitle = review.game?.title ?? 'Game';
  const bodyPreview = review.body?.trim() ?? '';
  const authorName = review.author.displayName;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Review by ${authorName} of ${gameTitle}, rating ${String(review.rating)}`}
      onPress={() => {
        onPress(review.id);
      }}
      style={{
        paddingHorizontal: theme.space('space.4'),
        paddingVertical: theme.space('space.3'),
        gap: theme.space('space.2'),
        borderBottomWidth: 1,
        borderBottomColor: theme.color('color.border.default'),
        backgroundColor: theme.color('color.background.primary'),
        minHeight: theme.space('space.16'),
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: theme.space('space.2'),
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open ${gameTitle}`}
          disabled={!onPressGame}
          onPress={() => {
            onPressGame?.(review.gameId);
          }}
          style={{ flex: 1 }}
        >
          <Text role="label" color="color.text.primary" numberOfLines={1}>
            {gameTitle}
          </Text>
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space('space.2') }}>
          <SpoilerBadge active={review.containsSpoilers} />
          <Badge tone="neutral">{visibilityLabel(review.visibility)}</Badge>
        </View>
      </View>

      <Text role="meta" color="color.text.secondary">
        {authorName} · Rating {String(review.rating)}
      </Text>

      {bodyPreview.length > 0 ? (
        <Text role="body" color="color.text.secondary" numberOfLines={3}>
          {bodyPreview}
        </Text>
      ) : null}

      {onPressEdit ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit review"
          onPress={() => {
            onPressEdit(review.id);
          }}
          hitSlop={8}
          style={{
            alignSelf: 'flex-start',
            minHeight: theme.space('space.10'),
            justifyContent: 'center',
          }}
        >
          <Text role="label" color="color.interactive.primary">
            Edit
          </Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

export const ReviewCard = memo(ReviewCardComponent);
