import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/theme-provider';

import { Text } from './text';

export interface ErrorBannerProps {
  title: string;
  description?: string;
  action?: ReactNode;
  style?: ViewStyle | ViewStyle[];
}

/**
 * Inline recoverable error — banner, not alert dialog (S4 ErrorState family).
 */
export function ErrorBanner({ title, description, action, style }: ErrorBannerProps) {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="alert"
      style={[
        {
          gap: theme.space('space.1'),
          paddingHorizontal: theme.space('space.3'),
          paddingVertical: theme.space('space.3'),
          borderRadius: theme.radius('radius.md'),
          borderWidth: 1,
          borderColor: theme.color('color.border.error'),
          backgroundColor: theme.color('color.surface.secondary'),
        },
        style,
      ]}
    >
      <Text role="label" color="color.status.error">
        {title}
      </Text>
      {description ? (
        <Text role="caption" color="color.text.secondary">
          {description}
        </Text>
      ) : null}
      {action ? <View style={{ marginTop: theme.space('space.2') }}>{action}</View> : null}
    </View>
  );
}
