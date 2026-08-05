import { View, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/theme-provider';

export interface LogoMarkProps {
  /** Edge length in px — a glyph dimension, not a layout gap, so it takes a literal. */
  size?: number;
  style?: ViewStyle | ViewStyle[];
}

/**
 * The rotated-square brand mark — a hairline square turned 45°, accent-bordered,
 * never filled. Shared by every screen that carries the wordmark (Home header now;
 * Login/Register/Onboarding per `SCREEN_REDESIGNS.md` §1–3 later), so it lives here
 * once rather than forking per screen.
 */
export function LogoMark({ size = 13, style }: LogoMarkProps) {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="none"
      style={[
        {
          width: size,
          height: size,
          borderWidth: 1.5,
          borderColor: theme.color('color.accent.default'),
          borderRadius: theme.radius('radius.sm'),
          transform: [{ rotate: '45deg' }],
        },
        style,
      ]}
    />
  );
}
