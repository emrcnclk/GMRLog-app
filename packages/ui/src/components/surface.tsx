import type { ReactNode } from 'react';
import { View, type ViewProps, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/theme-provider';
import type { SemanticElevationToken } from '../theme/tokens';

export interface SurfaceProps extends Omit<ViewProps, 'style'> {
  children: ReactNode;
  elevated?: boolean;
  elevationToken?: SemanticElevationToken;
  style?: ViewStyle | ViewStyle[];
}

/**
 * Place surface — elevation is structure, not power (F4.5 · S4 Surface).
 */
export function Surface({
  children,
  elevated = false,
  elevationToken = 'shadow.md',
  style,
  ...rest
}: SurfaceProps) {
  const theme = useTheme();
  const shadow = elevated ? theme.elevation(elevationToken) : theme.elevation('shadow.none');

  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: theme.color(
            elevated ? 'color.background.elevated' : 'color.surface.primary',
          ),
          borderRadius: theme.radius('radius.md'),
          ...shadow,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
