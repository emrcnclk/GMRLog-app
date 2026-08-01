import { Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { View } from 'react-native';

function DeleteAccountPlaceholderComponent() {
  const theme = useTheme();
  return (
    <View
      accessibilityLabel="Delete account placeholder"
      style={{
        paddingHorizontal: theme.space('space.4'),
        paddingVertical: theme.space('space.3'),
        gap: theme.space('space.1'),
        borderBottomWidth: 1,
        borderBottomColor: theme.color('color.border.default'),
      }}
    >
      <Text role="title" color="color.text.primary">
        Delete account
      </Text>
      <Text role="meta" color="color.text.tertiary">
        Placeholder — no delete-account endpoint on frozen backend.
      </Text>
    </View>
  );
}

export const DeleteAccountPlaceholder = memo(DeleteAccountPlaceholderComponent);
