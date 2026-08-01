import { EmptyState, useTheme } from '@gmrlog/ui';
import { Users } from 'lucide-react-native';
import { View } from 'react-native';

export function EmptyFriends() {
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
        accessibilityLabel="Empty friends illustration"
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
        title="No friends yet"
        description="When someone sends a request or you accept one, your circle gathers here. Pull to refresh anytime."
      />
    </View>
  );
}
