import { Button, EmptyState, useTheme } from '@gmrlog/ui';
import { Library } from 'lucide-react-native';
import { View } from 'react-native';

export interface EmptyLibraryProps {
  onDiscover?: () => void;
}

export function EmptyLibrary({ onDiscover }: EmptyLibraryProps) {
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
        accessibilityLabel="Empty library illustration"
        style={{
          width: theme.space('space.16'),
          height: theme.space('space.16'),
          borderRadius: theme.radius('radius.full'),
          backgroundColor: theme.color('color.surface.secondary'),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Library size={36} color={theme.color('color.text.secondary')} strokeWidth={1.5} />
      </View>
      <EmptyState
        title="Your library is empty"
        description="Track games you’re playing, finished, or saving for later."
      />
      {onDiscover ? (
        <Button variant="secondary" accessibilityLabel="Discover games" onPress={onDiscover}>
          Discover games
        </Button>
      ) : null}
    </View>
  );
}
