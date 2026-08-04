import { useTheme } from '@gmrlog/ui';
import { ChevronRight } from 'lucide-react-native';
import { memo } from 'react';

import { SettingsRow, type SettingsRowIcon } from './settings-row';

export interface SettingsNavRowProps {
  icon?: SettingsRowIcon;
  title: string;
  subtitle?: string;
  onPress: () => void;
  disabled?: boolean;
}

function SettingsNavRowComponent({
  icon,
  title,
  subtitle,
  onPress,
  disabled,
}: SettingsNavRowProps) {
  const theme = useTheme();
  return (
    <SettingsRow
      icon={icon}
      title={title}
      subtitle={subtitle}
      disabled={disabled}
      onPress={onPress}
      trailing={<ChevronRight size={14} color={theme.color('color.text.tertiary')} />}
    />
  );
}

export const SettingsNavRow = memo(SettingsNavRowComponent);
