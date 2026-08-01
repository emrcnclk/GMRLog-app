import { Text, useTheme } from '@gmrlog/ui';
import { memo, type ReactNode } from 'react';
import { View } from 'react-native';

export interface SettingsSectionHeaderProps {
  title: string;
  description?: string;
  trailing?: ReactNode;
}

function SettingsSectionHeaderComponent({
  title,
  description,
  trailing,
}: SettingsSectionHeaderProps) {
  const theme = useTheme();
  return (
    <View
      style={{
        paddingHorizontal: theme.space('space.4'),
        paddingTop: theme.space('space.4'),
        paddingBottom: theme.space('space.2'),
        gap: theme.space('space.1'),
        flexDirection: 'row',
        alignItems: 'flex-start',
      }}
    >
      <View style={{ flex: 1, gap: theme.space('space.1') }}>
        <Text role="label" color="color.text.secondary">
          {title}
        </Text>
        {description ? (
          <Text role="caption" color="color.text.tertiary">
            {description}
          </Text>
        ) : null}
      </View>
      {trailing}
    </View>
  );
}

export const SettingsSectionHeader = memo(SettingsSectionHeaderComponent);
