import { Text, TextField, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { View } from 'react-native';

export interface RegionFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

function RegionFieldComponent({ value, onChange, disabled }: RegionFieldProps) {
  const theme = useTheme();
  return (
    <View
      style={{
        paddingHorizontal: theme.space('space.4'),
        paddingVertical: theme.space('space.3'),
        gap: theme.space('space.2'),
        borderBottomWidth: 1,
        borderBottomColor: theme.color('color.border.default'),
      }}
    >
      <TextField
        label="Region"
        value={value}
        onChangeText={onChange}
        editable={!disabled}
        autoCapitalize="characters"
        autoCorrect={false}
        placeholder="TR"
        maxLength={8}
        accessibilityLabel="Region"
      />
      <Text role="caption" color="color.text.tertiary">
        Local preference only — not on SettingsResponse
      </Text>
    </View>
  );
}

export const RegionField = memo(RegionFieldComponent);
