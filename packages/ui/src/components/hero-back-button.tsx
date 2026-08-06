import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/theme-provider';

import { Icon } from './icon';
import { IconButton } from './icon-button';

export interface HeroBackButtonProps {
  onPress: () => void;
  /** Safe-area top padding, in points — supplied by the app layer. */
  topInset?: number;
  /** Name the destination where you can: "Back to Discover" beats "Go back". */
  accessibilityLabel?: string;
  /**
   * Sibling floating controls at the row's trailing edge — share, overflow.
   * Opt-in: omitted, the row renders exactly as before (back button alone).
   */
  trailing?: ReactNode;
  style?: ViewStyle | ViewStyle[];
}

/**
 * Back control for a screen that opens on full-bleed artwork.
 *
 * A hero has no bar to sit in, so the control floats over the image. Artwork is
 * arbitrary — it can be white sky or a black cave — which is why the chip
 * carries its own scrim rather than trusting the picture underneath to provide
 * contrast. That scrim is the whole reason this is not just an `IconButton`.
 */
export function HeroBackButton({
  onPress,
  topInset = 0,
  accessibilityLabel = 'Go back',
  trailing,
  style,
}: HeroBackButtonProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        {
          paddingTop: topInset,
          position: 'absolute',
          left: 0,
          right: 0,
          zIndex: 2,
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
        style,
      ]}
      pointerEvents="box-none"
    >
      <IconButton
        accessibilityLabel={accessibilityLabel}
        size="lg"
        onPress={onPress}
        hitSlop={8}
        style={{
          margin: theme.space('space.3'),
          backgroundColor: theme.color('color.scrim.strong'),
        }}
      >
        <Icon
          name="chevron-left"
          decorative
          size={theme.space('space.6')}
          color="color.scrim.foreground"
        />
      </IconButton>
      {trailing ?? null}
    </View>
  );
}
