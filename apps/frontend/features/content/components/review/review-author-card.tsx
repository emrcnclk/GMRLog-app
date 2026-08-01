import type { ReviewResponse } from '@gmrlog/types';
import { Avatar, Badge, Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { userInitials } from '../../../../shared/user/initials';
import { formatReadingTime } from '../../hooks/review-detail-model';

export interface ReviewAuthorCardProps {
  review: ReviewResponse;
  onPressAuthor: (userId: string) => void;
  onPressGame: (gameId: string) => void;
}

/**
 * Who wrote this, about what, how they scored it, and how long it takes to read.
 *
 * The rating is stated as "8 / 10" rather than as stars alone: the scale is
 * documented as 1–10, and a five-star rendering silently halves the resolution
 * the author actually chose.
 */
function ReviewAuthorCardComponent({ review, onPressAuthor, onPressGame }: ReviewAuthorCardProps) {
  const theme = useTheme();
  const readingTime = formatReadingTime(review.body);
  const gameTitle = review.game?.title ?? null;

  return (
    <View
      style={{
        paddingHorizontal: theme.space('space.4'),
        paddingVertical: theme.space('space.4'),
        gap: theme.space('space.4'),
      }}
    >
      {gameTitle !== null && review.game ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open ${gameTitle}`}
          onPress={() => {
            onPressGame(review.gameId);
          }}
          hitSlop={4}
        >
          <Text role="heading" numberOfLines={3}>
            {gameTitle}
          </Text>
        </Pressable>
      ) : (
        <Text role="heading">Review</Text>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space('space.3') }}>
        <Text role="display" color="color.text.primary">
          {String(review.rating)}
        </Text>
        <Text role="body" color="color.text.tertiary">
          / 10
        </Text>
        {review.containsSpoilers ? <Badge tone="warning">Spoilers</Badge> : null}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${review.author.displayName}'s profile`}
        onPress={() => {
          onPressAuthor(review.author.id);
        }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space('space.3') }}
      >
        <Avatar
          size="md"
          uri={review.author.avatarUrl ?? undefined}
          initials={userInitials(review.author.displayName)}
          accessibilityLabel={`${review.author.displayName} avatar`}
        />
        <View style={{ flex: 1, gap: theme.space('space.1') }}>
          <Text role="label" numberOfLines={1}>
            {review.author.displayName}
          </Text>
          <Text role="meta" color="color.text.tertiary" numberOfLines={1}>
            {readingTime === null
              ? `@${review.author.handle}`
              : `@${review.author.handle} · ${readingTime}`}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

export const ReviewAuthorCard = memo(ReviewAuthorCardComponent);
