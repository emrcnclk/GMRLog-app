import { Pressable, View, type ViewStyle } from 'react-native';

import { MIN_TOUCH_TARGET } from '../motion/pressable';
import { useTheme } from '../theme/theme-provider';

import { Text } from './text';

export interface SectionKickerProps {
  /** The section's name. Rendered uppercase by the `metaSm` role itself. */
  title: string;
  /**
   * Right-aligned counter — a bare figure such as "412". Pre-formatted; the
   * kicker never formats numbers itself.
   */
  counter?: string;
  /** Right-aligned text link, e.g. "All 412 →". Replaces `counter` when both are given. */
  actionLabel?: string;
  onPressAction?: () => void;
  style?: ViewStyle | ViewStyle[];
}

/**
 * The opening line of every section on every screen (SCREEN_REDESIGNS.md
 * §"Shared patterns"). Monospace, uppercase, tracked out, tertiary — a label
 * for the section rather than a heading over it.
 *
 * It exists as its own atom because three patterns need the identical rule and
 * cannot share a parent: `Section` stacks it over a block, `Rail` puts it above
 * a bleeding scroller, and screens use it bare between two unrelated groups. One
 * component keeps those three from drifting into three near-identical kickers.
 *
 * The redesign is explicit that this replaces section headings outright — there
 * are no 18px bold headings anywhere in the target design.
 */
export function SectionKicker({
  title,
  counter,
  actionLabel,
  onPressAction,
  style,
}: SectionKickerProps) {
  const theme = useTheme();
  const isLink = actionLabel !== undefined && onPressAction !== undefined;

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: theme.space('space.3'),
        },
        style,
      ]}
    >
      <Text role="metaSm" color="color.text.tertiary" numberOfLines={1} style={{ flexShrink: 1 }}>
        {title}
      </Text>

      {isLink ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${actionLabel}: ${title}`}
          onPress={onPressAction}
          hitSlop={12}
          // The kicker is 12px tall; without a floor here the link would be a
          // sub-tap-target hit area on both platforms.
          style={{ minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' }}
        >
          <Text role="metaSm" color="color.accent.default">
            {actionLabel}
          </Text>
        </Pressable>
      ) : counter !== undefined ? (
        <Text role="metaSm" color="color.text.tertiary">
          {counter}
        </Text>
      ) : null}
    </View>
  );
}
