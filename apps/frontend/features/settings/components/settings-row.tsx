import {
  MIN_TOUCH_TARGET,
  pressableMotionStyle,
  Text,
  useReduceMotion,
  useTheme,
} from '@gmrlog/ui';
import { memo, type ElementType, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

/**
 * `ElementType` rather than a `ComponentType<{ size, color }>`: TS compares a
 * `FunctionComponent`'s static `propTypes` field structurally, and lucide's
 * own `LucideProps` validator doesn't line up with a narrower custom shape
 * even though the runtime props (`size`, `color`) are exactly what's passed
 * below.
 */
export type SettingsRowIcon = ElementType;

export interface SettingsRowProps {
  /**
   * A lucide-react-native icon component, rendered at 17px tertiary
   * (SCREEN_REDESIGNS.md §9). Imported directly, not looked up by name —
   * `Icon`'s `name=` string lookup goes through a dynamic `require` that
   * resolves to `undefined` on web (no global `require` in an ESM bundle),
   * so it silently falls back to the placeholder box there. `profile-screen.tsx`
   * already sidesteps this the same way. Omit rows that have no icon to assign.
   */
  icon?: SettingsRowIcon;
  title: string;
  subtitle?: string;
  /** Value text, a toggle, or any other trailing control. */
  trailing?: ReactNode;
  /** Tappable nav row when set; a static row (e.g. holding a toggle) otherwise. */
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

const ROW_MIN_HEIGHT = 48;

/**
 * A grouped-card row (SCREEN_REDESIGNS.md §9): 48px minimum, a 17px tertiary
 * icon, a 14px label (the ramp's nearest step is `body`, 15px — recorded, not
 * inlined), and a trailing value/chevron/toggle. No border of its own — the
 * `SettingsGroupCard` it lives in draws the hairlines between rows.
 */
function SettingsRowComponent({
  icon,
  title,
  subtitle,
  trailing,
  onPress,
  disabled,
  accessibilityLabel,
}: SettingsRowProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();

  const IconComponent = icon;
  const content = (
    <>
      {IconComponent ? (
        <IconComponent size={17} color={theme.color('color.text.tertiary')} />
      ) : null}
      <View style={{ flex: 1, gap: theme.space('space.1') }}>
        <Text role="body" color="color.text.primary">
          {title}
        </Text>
        {subtitle !== undefined ? (
          <Text role="bodySm" color="color.text.tertiary">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
    </>
  );

  const rowStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: theme.space('space.3'),
    minHeight: ROW_MIN_HEIGHT,
    paddingHorizontal: theme.space('space.4'),
    opacity: disabled ? 0.5 : 1,
  };

  if (!onPress) {
    return <View style={rowStyle}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        rowStyle,
        { minHeight: Math.max(ROW_MIN_HEIGHT, MIN_TOUCH_TARGET) },
        pressableMotionStyle(pressed && !disabled, reduceMotion),
      ]}
    >
      {content}
    </Pressable>
  );
}

export const SettingsRow = memo(SettingsRowComponent);
