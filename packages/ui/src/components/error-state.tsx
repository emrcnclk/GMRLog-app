import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/theme-provider';

import { Text } from './text';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  style?: ViewStyle | ViewStyle[];
}

/**
 * Recoverable failure — retry action, no stack traces, no guilt (S4 ErrorState).
 */
export function ErrorState({
  title = 'Something went wrong',
  description,
  action,
  style,
}: ErrorStateProps) {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="alert"
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.space('space.3'),
          padding: theme.space('space.6'),
        },
        style,
      ]}
    >
      <Text role="title" color="color.status.error" style={{ textAlign: 'center' }}>
        {title}
      </Text>
      {description ? (
        <Text role="body" color="color.text.secondary" style={{ textAlign: 'center' }}>
          {description}
        </Text>
      ) : null}
      {action ? <View style={{ marginTop: theme.space('space.2') }}>{action}</View> : null}
    </View>
  );
}
