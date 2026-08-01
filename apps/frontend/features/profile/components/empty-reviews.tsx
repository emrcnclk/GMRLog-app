import { Button, EmptyState, useTheme } from '@gmrlog/ui';
import { Star } from 'lucide-react-native';
import { View } from 'react-native';

export interface EmptyReviewsProps {
  /** When true, backend has no own-reviews list endpoint. */
  listUnavailable?: boolean;
  onDiscover?: () => void;
}

export function EmptyReviews({ listUnavailable = false, onDiscover }: EmptyReviewsProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.space('space.6'),
        gap: theme.space('space.4'),
      }}
    >
      <View
        accessibilityLabel="Empty reviews illustration"
        style={{
          width: theme.space('space.16'),
          height: theme.space('space.16'),
          borderRadius: theme.radius('radius.full'),
          backgroundColor: theme.color('color.surface.secondary'),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Star size={36} color={theme.color('color.text.secondary')} strokeWidth={1.5} />
      </View>
      <EmptyState
        title={listUnavailable ? 'Reviews list coming later' : 'No reviews yet'}
        description={
          listUnavailable
            ? 'Your review history will appear here when the own-reviews index is available. Individual reviews stay open from activity and search.'
            : 'Share thoughtful takes on the games that matter to you.'
        }
      />
      {onDiscover ? (
        <Button variant="secondary" accessibilityLabel="Discover games" onPress={onDiscover}>
          Discover games
        </Button>
      ) : null}
    </View>
  );
}
