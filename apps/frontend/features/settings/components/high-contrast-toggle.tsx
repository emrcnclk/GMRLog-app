import { memo } from 'react';

import { SettingsToggleRow } from './settings-toggle-row';

export interface HighContrastToggleProps {
  value: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}

function HighContrastToggleComponent({ value, disabled, onChange }: HighContrastToggleProps) {
  return (
    <SettingsToggleRow
      title="High contrast"
      subtitle="Local preference only — not on SettingsResponse"
      value={value}
      disabled={disabled}
      onValueChange={onChange}
      accessibilityLabel="High contrast"
    />
  );
}

export const HighContrastToggle = memo(HighContrastToggleComponent);
