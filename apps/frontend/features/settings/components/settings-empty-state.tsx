import { EmptyState, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { View } from 'react-native';

export interface SettingsEmptyStateProps {
  title: string;
  description: string;
}

function SettingsEmptyStateComponent({ title, description }: SettingsEmptyStateProps) {
  const theme = useTheme();
  return (
    <View style={{ padding: theme.space('space.6') }}>
      <EmptyState title={title} description={description} />
    </View>
  );
}

export const SettingsEmptyState = memo(SettingsEmptyStateComponent);
