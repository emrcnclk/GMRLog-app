import { EmptyState, useTheme } from '@gmrlog/ui';
import { View } from 'react-native';

export function EmptyMembers() {
  const theme = useTheme();

  return (
    <View
      style={{
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.space('space.6'),
      }}
    >
      <EmptyState
        title="No members yet"
        description="When people join, they will appear here in join order."
      />
    </View>
  );
}
