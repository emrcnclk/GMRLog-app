import { memo } from 'react';

import { SettingsToggleRow } from './settings-toggle-row';

export interface LargerTextToggleProps {
  value: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}

function LargerTextToggleComponent({ value, disabled, onChange }: LargerTextToggleProps) {
  return (
    <SettingsToggleRow
      title="Larger text"
      subtitle="Local preference only — not on SettingsResponse"
      value={value}
      disabled={disabled}
      onValueChange={onChange}
      accessibilityLabel="Larger text"
    />
  );
}

export const LargerTextToggle = memo(LargerTextToggleComponent);
