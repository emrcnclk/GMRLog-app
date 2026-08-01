import { Button, Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { View } from 'react-native';

import type { LocalUiPrefs } from '../validators/settings-form';

export interface DateTimeFormatRowProps {
  value: LocalUiPrefs['dateFormat'];
  onChange: (value: LocalUiPrefs['dateFormat']) => void;
  disabled?: boolean;
}

const OPTIONS: LocalUiPrefs['dateFormat'][] = ['system', 'ymd', 'mdy', 'dmy'];

function labelFor(option: LocalUiPrefs['dateFormat']): string {
  switch (option) {
    case 'system':
      return 'System';
    case 'ymd':
      return 'YYYY-MM-DD';
    case 'mdy':
      return 'MM/DD/YYYY';
    case 'dmy':
      return 'DD/MM/YYYY';
  }
}

function DateTimeFormatRowComponent({ value, onChange, disabled }: DateTimeFormatRowProps) {
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
      <Text role="title" color="color.text.primary">
        Date & time format
      </Text>
      <Text role="meta" color="color.text.secondary">
        Local preference only — not on SettingsResponse
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space('space.2') }}>
        {OPTIONS.map((option) => (
          <Button
            key={option}
            size="sm"
            variant={value === option ? 'primary' : 'secondary'}
            disabled={disabled}
            accessibilityLabel={`Date format ${labelFor(option)}`}
            onPress={() => {
              onChange(option);
            }}
          >
            {labelFor(option)}
          </Button>
        ))}
      </View>
    </View>
  );
}

export const DateTimeFormatRow = memo(DateTimeFormatRowComponent);
