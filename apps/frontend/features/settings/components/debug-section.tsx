import { Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { View } from 'react-native';

export interface DebugSectionProps {
  visible: boolean;
  apiUrl: string;
  environment: string;
}

function DebugSectionComponent({ visible, apiUrl, environment }: DebugSectionProps) {
  const theme = useTheme();
  if (!visible) {
    return null;
  }

  return (
    <View
      accessibilityLabel="Debug section"
      style={{
        marginHorizontal: theme.space('space.4'),
        marginTop: theme.space('space.4'),
        padding: theme.space('space.4'),
        borderRadius: theme.radius('radius.md'),
        backgroundColor: theme.color('color.surface.secondary'),
        gap: theme.space('space.2'),
      }}
    >
      <Text role="label" color="color.text.secondary">
        Debug
      </Text>
      <Text role="caption" color="color.text.tertiary">
        Hidden in production builds.
      </Text>
      <Text role="meta" color="color.text.primary">
        env={environment}
      </Text>
      <Text role="meta" color="color.text.primary">
        api={apiUrl}
      </Text>
    </View>
  );
}

export const DebugSection = memo(DebugSectionComponent);
