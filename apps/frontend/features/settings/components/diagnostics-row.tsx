import { Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { View } from 'react-native';

export interface DiagnosticsRowProps {
  label: string;
  value: string;
}

function DiagnosticsRowComponent({ label, value }: DiagnosticsRowProps) {
  const theme = useTheme();
  return (
    <View
      accessibilityLabel={`${label}: ${value}`}
      style={{
        paddingHorizontal: theme.space('space.4'),
        paddingVertical: theme.space('space.3'),
        gap: theme.space('space.1'),
        borderBottomWidth: 1,
        borderBottomColor: theme.color('color.border.default'),
      }}
    >
      <Text role="label" color="color.text.secondary">
        {label}
      </Text>
      <Text role="body" color="color.text.primary">
        {value}
      </Text>
    </View>
  );
}

export const DiagnosticsRow = memo(DiagnosticsRowComponent);
