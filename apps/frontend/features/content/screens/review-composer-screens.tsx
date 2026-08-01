import { Screen, Text, useTheme } from '@gmrlog/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';

import { ComposerSkeleton } from '../components/composer-skeleton';
import { ContentErrorState } from '../components/content-error-state';
import { ReviewComposer } from '../components/review-composer';
import { useReview } from '../hooks/use-reviews';

function readParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

export function CreateReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ gameId?: string | string[] }>();
  const gameId = readParam(params.gameId);
  const theme = useTheme();

  if (gameId.length === 0) {
    return (
      <Screen>
        <View style={{ padding: theme.space('space.4'), gap: theme.space('space.3') }}>
          <Text role="heading">Create Review</Text>
          <Text role="body" color="color.text.secondary">
            A game is required to write a review. Open a game first, then choose Write a review.
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <ReviewComposer
      mode="create"
      gameId={gameId}
      onClose={() => {
        router.back();
      }}
    />
  );
}

export function EditReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const reviewId = readParam(params.id);
  const query = useReview(reviewId);

  if (query.isPending) {
    return (
      <Screen edges={[]} style={{ paddingTop: 0, paddingBottom: 0 }}>
        <ComposerSkeleton />
      </Screen>
    );
  }

  if (query.isError) {
    return (
      <Screen>
        <ContentErrorState
          title="Could not load review"
          onRetry={() => {
            void query.refetch();
          }}
        />
      </Screen>
    );
  }

  const review = query.data;

  return (
    <ReviewComposer
      mode="edit"
      gameId={review.gameId}
      review={review}
      onClose={() => {
        router.back();
      }}
      onDeleted={() => {
        router.replace(`/(app)/game/${review.gameId}/reviews`);
      }}
    />
  );
}
