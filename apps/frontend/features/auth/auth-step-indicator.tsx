import { useTheme } from '@gmrlog/ui';
import { Pressable, View } from 'react-native';

import {
  AUTH_STEP_BAR_HEIGHT,
  AUTH_STEP_BAR_WIDTH_ACTIVE,
  AUTH_STEP_BAR_WIDTH_INACTIVE,
  AUTH_TAP_TARGET,
} from './auth-layout';

export interface AuthStepIndicatorProps {
  /** How many steps the flow has. */
  count: number;
  /** Zero-based index of the step being shown. */
  activeIndex: number;
  /**
   * Makes the bars tappable — §3's Onboarding. Omitted, the rail renders exactly
   * the markup §2's Register has always had: three plain `View`s, no pressable,
   * no tap target. Opt-in because Register must not gain the affordance.
   */
  onSelect?: (index: number) => void;
}

/**
 * `SCREEN_REDESIGNS.md` §3's progress rail, used first by §2's Register.
 *
 * §2 calls it "the dot indicator from Onboarding"; §3 corrects the shape —
 * "**Progress is three 2px bars, not dots**" — so bars are what this draws. It
 * sits in `AuthShell`'s `topZoneFooter` slot, which is where §3 puts it: under
 * the body, inside the top zone.
 *
 * It is local to `features/auth` for the same reason `AuthShell` is: its two
 * consumers (§2 and §3) are both auth-flow screens, and a step rail for one
 * feature is not a design-system atom. 3.12 imports this rather than drawing a
 * second one — the drift §2 warns about is not limited to the headline.
 *
 * **Register stays non-interactive, deliberately.** §3 wants Onboarding's bars
 * tappable, where jumping between three panels costs nothing. Register cannot
 * offer that: forward means skipping validation, and backward is already the
 * "Back" button below. So the affordance arrives as an opt-in `onSelect` (3.12)
 * and Register simply does not pass it.
 *
 * **The bar is not the target.** A 2px rule is nowhere near CLAUDE.md's 44px
 * floor, so when `onSelect` is given each bar is centred inside a `Pressable`
 * that is `AUTH_TAP_TARGET` tall and at least that wide. The rule keeps its
 * exact geometry; only the thing you can hit grows. That also means the rail's
 * own height changes between the two callers, which is why the gap under it
 * belongs to `AuthShell` and not to either screen.
 */
export function AuthStepIndicator({ count, activeIndex, onSelect }: AuthStepIndicatorProps) {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${String(activeIndex + 1)} of ${String(count)}`}
      accessibilityValue={{ min: 1, max: count, now: activeIndex + 1 }}
      aria-valuemin={1}
      aria-valuemax={count}
      aria-valuenow={activeIndex + 1}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        // Tappable bars carry their own target width, so the gap between the
        // rules is already there; adding `space.1` on top would space the
        // targets, not the rules, and §3's rail would read as three buttons.
        gap: onSelect === undefined ? theme.space('space.1') : 0,
      }}
    >
      {Array.from({ length: count }, (_, index) => {
        const isActive = index === activeIndex;
        // Keyed here so the non-interactive branch renders the bar as a direct
        // child of the row — byte-for-byte the markup Register already had.
        const bar = (
          <View
            key={index}
            style={{
              height: AUTH_STEP_BAR_HEIGHT,
              width: theme.space(
                isActive ? AUTH_STEP_BAR_WIDTH_ACTIVE : AUTH_STEP_BAR_WIDTH_INACTIVE,
              ),
              // The accent as a 2px rule is the law's own example of what it is
              // for — a line, not a fill.
              backgroundColor: theme.color(
                isActive ? 'color.accent.default' : 'color.border.default',
              ),
            }}
          />
        );

        if (onSelect === undefined) {
          return bar;
        }

        return (
          <Pressable
            key={index}
            accessibilityRole="button"
            accessibilityLabel={`Go to step ${String(index + 1)} of ${String(count)}`}
            accessibilityState={{ selected: isActive }}
            aria-selected={isActive}
            onPress={() => {
              onSelect(index);
            }}
            style={{
              minHeight: AUTH_TAP_TARGET,
              minWidth: AUTH_TAP_TARGET,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {bar}
          </Pressable>
        );
      })}
    </View>
  );
}
