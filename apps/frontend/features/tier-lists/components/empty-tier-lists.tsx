import { Button, EmptyState, useTheme } from '@gmrlog/ui';
import { ListOrdered } from 'lucide-react-native';
import { View } from 'react-native';

export interface EmptyTierListsProps {
  onCreate?: () => void;
  onDiscover?: () => void;
}

export function EmptyTierLists({ onCreate, onDiscover }: EmptyTierListsProps) {
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
        accessibilityLabel="Empty tier lists illustration"
        style={{
          width: theme.space('space.16'),
          height: theme.space('space.16'),
          borderRadius: theme.radius('radius.full'),
          backgroundColor: theme.color('color.surface.secondary'),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ListOrdered size={36} color={theme.color('color.text.secondary')} strokeWidth={1.5} />
      </View>
      <EmptyState
        title="No tier lists yet"
        description="Rank games across S–F when you want a sharper take."
      />
      {onCreate ? (
        <Button variant="primary" accessibilityLabel="Create tier list" onPress={onCreate}>
          Create tier list
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
