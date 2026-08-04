import { Toggle } from '@gmrlog/ui';
import { memo } from 'react';

import { SettingsRow } from './settings-row';

export interface NotificationPrefRowProps {
  title: string;
  subtitle: string;
}

/** Honest disabled row — no notification preferences PATCH on frozen backend. */
function NotificationPrefRowComponent({ title, subtitle }: NotificationPrefRowProps) {
  return (
    <SettingsRow
      title={title}
      subtitle={subtitle}
      disabled
      accessibilityLabel={`${title} unavailable`}
      trailing={
        <Toggle
          value={false}
          disabled
          onValueChange={() => {
            /* frozen backend — no preferences endpoint yet */
          }}
          accessibilityLabel={`${title} disabled`}
        />
      }
    />
  );
}

export const NotificationPrefRow = memo(NotificationPrefRowComponent);
