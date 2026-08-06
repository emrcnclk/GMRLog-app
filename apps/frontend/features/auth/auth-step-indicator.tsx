import { useTheme } from '@gmrlog/ui';
import { View } from 'react-native';

import {
  AUTH_STEP_BAR_HEIGHT,
  AUTH_STEP_BAR_WIDTH_ACTIVE,
  AUTH_STEP_BAR_WIDTH_INACTIVE,
} from './auth-layout';

export interface AuthStepIndicatorProps {
  /** How many steps the flow has. */
  count: number;
  /** Zero-based index of the step being shown. */
  activeIndex: number;
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
 * **Not interactive here, deliberately.** §3 wants Onboarding's bars tappable,
 * where jumping between three panels costs nothing. Register cannot offer that:
 * forward means skipping validation, and backward is already the "Back" button
 * below. A 2px bar is also nowhere near the 44px tap target CLAUDE.md requires,
 * so the affordance needs a real target designed around it. 3.12 owns that,
 * together with the `onSelect` prop it will add.
 */
export function AuthStepIndicator({ count, activeIndex }: AuthStepIndicatorProps) {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${String(activeIndex + 1)} of ${String(count)}`}
      accessibilityValue={{ min: 1, max: count, now: activeIndex + 1 }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space('space.1') }}
    >
      {Array.from({ length: count }, (_, index) => {
        const isActive = index === activeIndex;
        return (
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
      })}
    </View>
  );
}
