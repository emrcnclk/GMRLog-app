import { View, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/theme-provider';

export type DividerOrientation = 'horizontal' | 'vertical';

export interface DividerProps {
  orientation?: DividerOrientation;
  style?: ViewStyle | ViewStyle[];
}

/**
 * Separates peer groups — not decorative noise (S4 Divider).
 */
export function Divider({ orientation = 'horizontal', style }: DividerProps) {
  const theme = useTheme();
  const isHorizontal = orientation === 'horizontal';

  return (
    <View
      accessibilityRole="none"
      style={[
        {
          backgroundColor: theme.color('color.border.default'),
          height: isHorizontal ? 1 : '100%',
          width: isHorizontal ? '100%' : 1,
          alignSelf: 'stretch',
        },
        style,
      ]}
    />
  );
}
