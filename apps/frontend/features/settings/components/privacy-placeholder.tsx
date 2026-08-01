import { Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { View } from 'react-native';

function PrivacyPlaceholderComponent() {
  const theme = useTheme();
  return (
    <View
      accessibilityLabel="Privacy settings placeholder"
      style={{
        paddingHorizontal: theme.space('space.4'),
        paddingVertical: theme.space('space.3'),
        gap: theme.space('space.1'),
        borderBottomWidth: 1,
        borderBottomColor: theme.color('color.border.default'),
      }}
    >
      <Text role="title" color="color.text.primary">
        Privacy
      </Text>
      <Text role="meta" color="color.text.tertiary">
        Placeholder — PATCH /settings/privacy is deferred (S1/S2).
      </Text>
    </View>
  );
}

export const PrivacyPlaceholder = memo(PrivacyPlaceholderComponent);
