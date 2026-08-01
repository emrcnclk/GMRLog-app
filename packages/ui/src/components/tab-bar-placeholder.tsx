import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/theme-provider';

import { Text } from './text';

export interface TabBarPlaceholderProps {
  /** Structural slots only — no product tab definitions. */
  slots?: number;
  children?: ReactNode;
  style?: ViewStyle | ViewStyle[];
}

/**
 * Structural tab bar placeholder — hosts composition; does not define product tabs.
 */
export function TabBarPlaceholder({ slots = 5, children, style }: TabBarPlaceholderProps) {
  const theme = useTheme();
  const count = Math.max(1, Math.min(slots, 6));

  return (
    <View
      accessibilityRole="tablist"
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
          paddingVertical: theme.space('space.2'),
          paddingHorizontal: theme.space('space.2'),
          backgroundColor: theme.color('color.background.elevated'),
          borderTopWidth: 1,
          borderTopColor: theme.color('color.border.default'),
          ...theme.elevation('shadow.sm'),
        },
        style,
      ]}
    >
      {children ??
        Array.from({ length: count }, (_, index) => (
          <View
            key={`tab-slot-${String(index)}`}
            accessibilityRole="tab"
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: theme.space('space.2'),
            }}
          >
            <View
              style={{
                width: theme.space('space.6'),
                height: theme.space('space.1'),
                borderRadius: theme.radius('radius.full'),
                backgroundColor: theme.color('color.border.default'),
                marginBottom: theme.space('space.1'),
              }}
            />
            <Text role="caption" color="color.text.tertiary">
              Tab
            </Text>
          </View>
        ))}
    </View>
  );
}
