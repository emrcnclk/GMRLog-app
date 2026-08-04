import { Screen, ScreenTitle, useTheme } from '@gmrlog/ui';
import { memo, type ReactNode } from 'react';
import { ScrollView } from 'react-native';

export interface SettingsScreenChromeProps {
  title: string;
  /** Visible back-link text — name the destination (`ScreenTitle` convention). */
  backLabel: string;
  onBack: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

function SettingsScreenChromeComponent({
  title,
  backLabel,
  onBack,
  children,
  footer,
}: SettingsScreenChromeProps) {
  const theme = useTheme();

  return (
    <Screen edges={['top']}>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: theme.space('space.10'),
          gap: theme.space('space.2'),
        }}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenTitle title={title} backLabel={backLabel} onPressBack={onBack} />
        {children}
        {footer}
      </ScrollView>
    </Screen>
  );
}

export const SettingsScreenChrome = memo(SettingsScreenChromeComponent);
