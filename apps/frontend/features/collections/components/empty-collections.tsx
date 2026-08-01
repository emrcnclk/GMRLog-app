import { Button, EmptyState, useTheme } from '@gmrlog/ui';
import { Folder } from 'lucide-react-native';
import { View } from 'react-native';

export interface EmptyCollectionsProps {
  onCreate?: () => void;
  onDiscover?: () => void;
}

export function EmptyCollections({ onCreate, onDiscover }: EmptyCollectionsProps) {
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
        accessibilityLabel="Empty collections illustration"
        style={{
          width: theme.space('space.16'),
          height: theme.space('space.16'),
          borderRadius: theme.radius('radius.full'),
          backgroundColor: theme.color('color.surface.secondary'),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Folder size={36} color={theme.color('color.text.secondary')} strokeWidth={1.5} />
      </View>
      <EmptyState
        title="No collections yet"
        description="Gather games into curated sets that reflect your taste."
      />
      {onCreate ? (
        <Button variant="primary" accessibilityLabel="Create collection" onPress={onCreate}>
          Create collection
        </Button>
      ) : null}
      {onDiscover ? (
        <Button variant="secondary" accessibilityLabel="Discover games" onPress={onDiscover}>
          Discover games
        </Button>
      ) : null}
    </View>
  );
}
