import { memo } from 'react';

import { SettingsToggleRow } from './settings-toggle-row';

export interface ReduceMotionToggleProps {
  value: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}

function ReduceMotionToggleComponent({ value, disabled, onChange }: ReduceMotionToggleProps) {
  return (
    <SettingsToggleRow
      title="Reduce motion"
      subtitle="Synced via PATCH /settings/accessibility"
      value={value}
      disabled={disabled}
      onValueChange={onChange}
      accessibilityLabel="Reduce motion"
    />
  );
}

export const ReduceMotionToggle = memo(ReduceMotionToggleComponent);
