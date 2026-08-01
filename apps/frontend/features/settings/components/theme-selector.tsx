import type { ThemePreferenceValue } from '@gmrlog/types';
import { Button, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { View } from 'react-native';

import { THEME_OPTIONS, themeLabel } from '../model/settings-model';

export interface ThemeSelectorProps {
  value: ThemePreferenceValue;
  disabled?: boolean;
  onChange: (theme: ThemePreferenceValue) => void;
}

function ThemeSelectorComponent({ value, disabled, onChange }: ThemeSelectorProps) {
  const theme = useTheme();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel="Theme preference"
      style={{
        paddingHorizontal: theme.space('space.4'),
        gap: theme.space('space.2'),
      }}
    >
      {THEME_OPTIONS.map((option) => (
        <Button
          key={option}
          variant={value === option ? 'primary' : 'secondary'}
          accessibilityLabel={`${themeLabel(option)} theme`}
          accessibilityState={{ selected: value === option }}
          disabled={disabled}
          onPress={() => {
            onChange(option);
          }}
        >
          {themeLabel(option)}
        </Button>
      ))}
    </View>
  );
}

export const ThemeSelector = memo(ThemeSelectorComponent);
