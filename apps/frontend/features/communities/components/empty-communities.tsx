import { Button, EmptyState, useTheme } from '@gmrlog/ui';
import { Users } from 'lucide-react-native';
import { View } from 'react-native';

export interface EmptyCommunitiesProps {
  onCreate?: () => void;
  onDiscover?: () => void;
}

export function EmptyCommunities({ onCreate, onDiscover }: EmptyCommunitiesProps) {
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
        accessibilityLabel="Empty communities illustration"
        style={{
          width: theme.space('space.16'),
          height: theme.space('space.16'),
          borderRadius: theme.radius('radius.full'),
          backgroundColor: theme.color('color.surface.secondary'),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Users size={36} color={theme.color('color.text.secondary')} strokeWidth={1.5} />
      </View>
      <EmptyState
        title="No communities yet"
        description="Create a room for shared taste, or discover communities that already feel like home."
      />
      {onCreate ? (
        <Button variant="primary" accessibilityLabel="Create community" onPress={onCreate}>
          Create community
        </Button>
      ) : null}
      {onDiscover ? (
        <Button variant="secondary" accessibilityLabel="Discover communities" onPress={onDiscover}>
          Discover
        </Button>
      ) : null}
    </View>
  );
}
