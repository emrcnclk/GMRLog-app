import { View, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/theme-provider';

export interface LogoMarkProps {
  /** Edge length in px — a glyph dimension, not a layout gap, so it takes a literal. */
  size?: number;
  /**
   * Ambient accent glow behind the mark (`SCREEN_REDESIGNS.md` §1). Off by
   * default so the inline header mark is unchanged; the auth screens, where the
   * mark stands alone in an otherwise empty zone, switch it on.
   */
  glow?: boolean;
  style?: ViewStyle | ViewStyle[];
}

/**
 * The rotated-square brand mark — a hairline square turned 45°, accent-bordered,
 * never filled. Shared by every screen that carries the wordmark (Home header;
 * Login/Register/Onboarding per `SCREEN_REDESIGNS.md` §1–3), so it lives here
 * once rather than forking per screen.
 *
 * The glow is the system's existing ambient treatment, not a new effect: an
 * elevation token with its downward offset dropped and the accent as the shadow
 * colour, exactly as the rarity plates and the profile's completed case draw
 * theirs. A lift would read as a raised card; this reads as light.
 */
export function LogoMark({ size = 13, glow = false, style }: LogoMarkProps) {
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
        glow
          ? {
              ...theme.elevation('shadow.xl'),
              shadowColor: theme.color('color.accent.default'),
              shadowOffset: { width: 0, height: 0 },
            }
          : null,
        style,
      ]}
    />
  );
}
