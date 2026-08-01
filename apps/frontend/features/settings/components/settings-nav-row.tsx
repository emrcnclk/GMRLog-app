import { ListItem, Text } from '@gmrlog/ui';
import { memo } from 'react';

export interface SettingsNavRowProps {
  title: string;
  subtitle?: string;
  onPress: () => void;
  disabled?: boolean;
}

function SettingsNavRowComponent({ title, subtitle, onPress, disabled }: SettingsNavRowProps) {
  return (
    <ListItem
      title={title}
      subtitle={subtitle}
      accessibilityLabel={title}
      disabled={disabled}
      onPress={onPress}
      trailing={
        <Text role="meta" color="color.text.tertiary">
          ›
        </Text>
      }
    />
  );
}

export const SettingsNavRow = memo(SettingsNavRowComponent);
