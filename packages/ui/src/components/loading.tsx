import { ActivityIndicator, View, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/theme-provider';
import type { SemanticSpaceToken } from '../theme/tokens';

import { Text } from './text';

export type LoadingSize = 'sm' | 'md' | 'lg';

export interface LoadingProps {
  label?: string;
  size?: LoadingSize;
  style?: ViewStyle | ViewStyle[];
}

const INDICATOR: Record<LoadingSize, 'small' | 'large'> = {
  sm: 'small',
  md: 'small',
  lg: 'large',
};

const GAP: Record<LoadingSize, SemanticSpaceToken> = {
  sm: 'space.1',
  md: 'space.2',
  lg: 'space.3',
};

/**
 * Indeterminate progress — calm, interruptible (F4.9 · S4 Loading).
 */
export function Loading({ label, size = 'md', style }: LoadingProps) {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label ?? 'Loading'}
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.space(GAP[size]),
          padding: theme.space('space.4'),
        },
        style,
      ]}
    >
      <ActivityIndicator size={INDICATOR[size]} color={theme.color('color.interactive.primary')} />
      {label ? (
        <Text role="meta" color="color.text.secondary">
          {label}
        </Text>
      ) : null}
    </View>
  );
}
