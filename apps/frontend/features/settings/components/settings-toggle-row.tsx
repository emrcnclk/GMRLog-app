import { Toggle } from '@gmrlog/ui';
import { memo } from 'react';

import { SettingsRow, type SettingsRowIcon } from './settings-row';

export interface SettingsToggleRowProps {
  icon?: SettingsRowIcon;
  title: string;
  subtitle?: string;
  value: boolean;
  disabled?: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel: string;
}

function SettingsToggleRowComponent({
  icon,
  title,
  subtitle,
  value,
  disabled,
  onValueChange,
  accessibilityLabel,
}: SettingsToggleRowProps) {
  return (
    <SettingsRow
      icon={icon}
      title={title}
      subtitle={subtitle}
      disabled={disabled}
      trailing={
        <Toggle
          value={value}
          disabled={disabled}
          onValueChange={onValueChange}
          accessibilityLabel={accessibilityLabel}
        />
      }
    />
  );
}

export const SettingsToggleRow = memo(SettingsToggleRowComponent);
