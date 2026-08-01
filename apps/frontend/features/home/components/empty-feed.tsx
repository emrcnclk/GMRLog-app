import { Button, EmptyState, useTheme } from '@gmrlog/ui';
import { Compass } from 'lucide-react-native';
import { View } from 'react-native';

export interface EmptyFeedProps {
  onDiscover: () => void;
}

/**
 * Empty activity center — calm CTA toward Discover (no FOMO).
 */
export function EmptyFeed({ onDiscover }: EmptyFeedProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.space('space.6'),
      }}
    >
      <View
        accessibilityLabel="Discover illustration placeholder"
        style={{
          width: theme.space('space.16'),
          height: theme.space('space.16'),
          borderRadius: theme.radius('radius.full'),
          backgroundColor: theme.color('color.surface.secondary'),
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: theme.space('space.4'),
        }}
      >
        <Compass size={36} color={theme.color('color.text.secondary')} strokeWidth={1.5} />
      </View>

      <EmptyState
        title="Your feed is quiet"
        description="When friends review, log, and collect, their culture shows up here."
        action={
          <Button onPress={onDiscover} accessibilityLabel="Discover games">
            Discover games
          </Button>
        }
      />
    </View>
  );
}
