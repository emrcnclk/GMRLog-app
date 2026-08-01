import { TextField, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { View } from 'react-native';

export interface LanguageFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

/** Locale maps to SettingsResponse.appearance.locale via PATCH /settings/appearance. */
function LanguageFieldComponent({ value, onChange, disabled, error }: LanguageFieldProps) {
  const theme = useTheme();
  return (
    <View style={{ paddingHorizontal: theme.space('space.4'), gap: theme.space('space.2') }}>
      <TextField
        label="Language / locale"
        value={value}
        onChangeText={onChange}
        editable={!disabled}
        error={error}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="en-US"
        maxLength={35}
        accessibilityLabel="Language locale"
      />
    </View>
  );
}

export const LanguageField = memo(LanguageFieldComponent);
