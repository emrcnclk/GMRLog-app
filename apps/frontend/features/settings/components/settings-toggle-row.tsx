import { Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { Switch, View } from 'react-native';

export interface SettingsToggleRowProps {
  title: string;
  subtitle?: string;
  value: boolean;
  disabled?: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel: string;
}

function SettingsToggleRowComponent({
  title,
  subtitle,
  value,
  disabled,
  onValueChange,
  accessibilityLabel,
}: SettingsToggleRowProps) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space('space.3'),
        paddingHorizontal: theme.space('space.4'),
        paddingVertical: theme.space('space.3'),
        borderBottomWidth: 1,
        borderBottomColor: theme.color('color.border.default'),
      }}
    >
      <View style={{ flex: 1, gap: theme.space('space.1') }}>
        <Text role="title" color="color.text.primary">
          {title}
        </Text>
        {subtitle ? (
          <Text role="meta" color="color.text.secondary">
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        disabled={disabled}
        onValueChange={onValueChange}
        accessibilityLabel={accessibilityLabel}
        trackColor={{
          false: theme.color('color.border.default'),
          true: theme.color('color.interactive.primary'),
        }}
      />
    </View>
  );
}

export const SettingsToggleRow = memo(SettingsToggleRowComponent);
