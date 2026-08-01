import { useTheme } from '@gmrlog/ui';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { ScreenHeader } from '../../../src/navigation/screen-header';

export interface GameHubTabShellProps {
  title: string;
  onBack: () => void;
  action?: ReactNode;
  children: ReactNode;
}

export function GameHubTabShell({ title, onBack, action, children }: GameHubTabShellProps) {
  const theme = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.color('color.background.primary') }}>
      <ScreenHeader
        title={title}
        titleRole="title"
        onBack={onBack}
        trailing={action ?? undefined}
      />
      {children}
    </View>
  );
}
