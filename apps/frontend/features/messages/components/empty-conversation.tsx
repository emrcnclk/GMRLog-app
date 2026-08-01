import { EmptyState, useTheme } from '@gmrlog/ui';
import { View } from 'react-native';

export function EmptyConversation() {
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
        title="No messages yet"
        description="Say hello. Messages appear here after you send or refresh."
      />
    </View>
  );
}
