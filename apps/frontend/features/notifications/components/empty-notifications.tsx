import { EmptyState, useTheme } from '@gmrlog/ui';
import { Bell } from 'lucide-react-native';
import { View } from 'react-native';

export function EmptyNotifications() {
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
        accessibilityLabel="Empty notifications illustration"
        style={{
          width: theme.space('space.16'),
          height: theme.space('space.16'),
          borderRadius: theme.radius('radius.full'),
          backgroundColor: theme.color('color.surface.secondary'),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Bell size={36} color={theme.color('color.text.secondary')} strokeWidth={1.5} />
      </View>
      <EmptyState
        title="No notifications yet"
        description="When someone interacts with your culture trail, attention will land here. Pull to refresh anytime."
      />
    </View>
  );
}
