import { Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { View } from 'react-native';

function AccentPreviewComponent() {
  const theme = useTheme();
  return (
    <View
      accessibilityLabel="Accent preview"
      style={{
        paddingHorizontal: theme.space('space.4'),
        paddingVertical: theme.space('space.3'),
        gap: theme.space('space.2'),
        borderBottomWidth: 1,
        borderBottomColor: theme.color('color.border.default'),
      }}
    >
      <Text role="title" color="color.text.primary">
        Accent
      </Text>
      <Text role="meta" color="color.text.secondary">
        Preview only — accent tokens are fixed in the Design System.
      </Text>
      <View style={{ flexDirection: 'row', gap: theme.space('space.2') }}>
        <View
          style={{
            width: theme.space('space.8'),
            height: theme.space('space.8'),
            borderRadius: theme.radius('radius.md'),
            backgroundColor: theme.color('color.interactive.primary'),
          }}
        />
        <View
          style={{
            width: theme.space('space.8'),
            height: theme.space('space.8'),
            borderRadius: theme.radius('radius.md'),
            backgroundColor: theme.color('color.surface.secondary'),
            borderWidth: 1,
            borderColor: theme.color('color.border.default'),
          }}
        />
      </View>
    </View>
  );
}

export const AccentPreview = memo(AccentPreviewComponent);
