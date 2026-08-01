import { Text, useTheme } from '@gmrlog/ui';
import { View } from 'react-native';

export function EmptyBookmarks() {
  const theme = useTheme();
  return (
    <View
      accessibilityRole="text"
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.space('space.6'),
        gap: theme.space('space.2'),
      }}
    >
      <Text role="title" color="color.text.primary">
        No bookmarks yet
      </Text>
      <Text role="body" color="color.text.secondary" style={{ textAlign: 'center' }}>
        Save posts privately from post detail. They appear here.
      </Text>
    </View>
  );
}
