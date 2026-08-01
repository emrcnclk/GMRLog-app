import { Screen, useTheme } from '@gmrlog/ui';
import { memo, type ReactNode } from 'react';
import { ScrollView } from 'react-native';

import { ScreenHeader } from '../../../src/navigation/screen-header';

export interface SettingsScreenChromeProps {
  title: string;
  onBack: () => void;
  children: ReactNode;
  footer?: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}

function SettingsScreenChromeComponent({
  title,
  onBack,
  children,
  footer,
}: SettingsScreenChromeProps) {
  const theme = useTheme();

  return (
    <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
      <ScreenHeader title={title} titleRole="title" onBack={onBack} />
      <ScrollView
        contentContainerStyle={{
          paddingBottom: theme.space('space.10'),
          gap: theme.space('space.2'),
        }}
        keyboardShouldPersistTaps="handled"
      >
        {children}
        {footer}
      </ScrollView>
    </Screen>
  );
}

export const SettingsScreenChrome = memo(SettingsScreenChromeComponent);
