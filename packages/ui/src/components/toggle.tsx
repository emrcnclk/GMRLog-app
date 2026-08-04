import { Pressable, View, type ViewStyle } from 'react-native';

import { MIN_TOUCH_TARGET } from '../motion/pressable';
import { useTheme } from '../theme/theme-provider';
import {
  TOGGLE_KNOB_INSET,
  TOGGLE_KNOB_SIZE,
  TOGGLE_KNOB_TRAVEL,
  TOGGLE_TRACK_HEIGHT,
  TOGGLE_TRACK_WIDTH,
} from '../theme/toggle-geometry';

const HIT_SLOP = Math.ceil((MIN_TOUCH_TARGET - TOGGLE_TRACK_HEIGHT) / 2);

export interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  accessibilityLabel: string;
  style?: ViewStyle | ViewStyle[];
}

/**
 * The system's own switch (SCREEN_REDESIGNS.md §9): a 40×23 track and a 17px
 * knob. Not RN's native `Switch` — its platform chrome (iOS pill, Android
 * Material track) can't be held to this exact shape on both, and the redesign
 * asks for one shape everywhere. `hitSlop` pads the 23px track back up to the
 * 44px tap-target floor.
 *
 * The knob position is a plain computed `left`, not an `Animated.Value` — an
 * interpolated `transform` driven by `Animated.timing` never advanced past
 * its start position on this app's React Native Web build (confirmed with
 * `useNativeDriver` both `true` and `false`; the on/off *colors*, which are
 * plain re-renders rather than animated, always updated correctly). A snap
 * is correct on both platforms; a broken slide is correct on neither.
 */
export function Toggle({ value, onValueChange, disabled, accessibilityLabel, style }: ToggleProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={() => {
        onValueChange(!value);
      }}
      hitSlop={HIT_SLOP}
      style={[
        {
          width: TOGGLE_TRACK_WIDTH,
          height: TOGGLE_TRACK_HEIGHT,
          borderRadius: theme.radius('radius.full'),
          borderWidth: 1,
          borderColor: value
            ? theme.color('color.accent.default')
            : theme.color('color.border.default'),
          backgroundColor: value ? theme.color('color.accent.default') : 'transparent',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <View
        style={{
          width: TOGGLE_KNOB_SIZE,
          height: TOGGLE_KNOB_SIZE,
          borderRadius: theme.radius('radius.full'),
          backgroundColor: value
            ? theme.color('color.accent.onAccent')
            : theme.color('color.background.elevated'),
          transform: [{ translateX: value ? TOGGLE_KNOB_TRAVEL : TOGGLE_KNOB_INSET }],
        }}
      />
    </Pressable>
  );
}
