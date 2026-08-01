import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/theme-provider';

import { Text } from './text';

export interface SectionProps {
  title?: string;
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
}

/**
 * Group with optional heading — one purpose per section (F4.4 · S4 Section).
 */
export function Section({ title, children, style }: SectionProps) {
  const theme = useTheme();

  return (
    <View style={[{ gap: theme.space('space.3') }, style]}>
      {title ? (
        <Text role="heading" color="color.text.primary">
          {title}
        </Text>
      ) : null}
      {children}
    </View>
  );
}
