import { Button, useTheme } from '@gmrlog/ui';
import { useState } from 'react';

import { AUTH_BUTTON_HEIGHT } from '../auth/auth-layout';
import { AuthShell } from '../auth/auth-shell';
import { AuthStepIndicator } from '../auth/auth-step-indicator';

import { isLastOnboardingPanel, nextOnboardingPanel, ONBOARDING_PANELS } from './onboarding-panels';

export interface OnboardingScreenProps {
  /**
   * Called once, when the player finishes the last panel or skips. The screen
   * does not persist anything itself — `OnboardingGate` owns that, so this stays
   * a pure surface and the storage seam has exactly one owner.
   */
  onComplete: () => void;
}

/**
 * `SCREEN_REDESIGNS.md` §3 — Onboarding: "the Login shell, three times, with a
 * dot rail".
 *
 * Taken literally: `AuthShell`, `AUTH_BUTTON_HEIGHT` and `AuthStepIndicator` are
 * imported, not re-derived — the same rule 3.11 followed, and the reason the
 * shell was made a component in 3.10. Nothing here draws a column, rounds §1's
 * pixel numbers again, or draws a second rail.
 *
 * Unlike the rest of Phase 3 this screen is net-new (0.1: `features/onboarding/`
 * was a lone `index.ts`), so there is no hook, form or state to preserve — but
 * there is also nothing to invent: every panel is copy the prototype already
 * carries, and the only new state is which panel is showing.
 */
export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const theme = useTheme();
  const [index, setIndex] = useState(0);

  const panel = ONBOARDING_PANELS[index];
  const isLast = isLastOnboardingPanel(index);

  if (panel === undefined) {
    return null;
  }

  return (
    <AuthShell
      headline={panel.title}
      body={panel.body}
      topZoneFooter={
        <AuthStepIndicator
          count={ONBOARDING_PANELS.length}
          activeIndex={index}
          // §3: "They are tappable." Jumping between three panels of copy costs
          // nothing — there is no validation to skip and no order to enforce.
          onSelect={setIndex}
        />
      }
    >
      {/* §3's bottom zone: "a single full-width continue button plus a Skip text
          button." The continue takes the accent, since here it genuinely is the
          primary path and — unlike Login's provider stack — it leads somewhere
          real. Both sit at `AUTH_BUTTON_HEIGHT`, the same geometry §2 and §1
          use, because §2's "one screen in two states" applies to all three. */}
      <Button
        variant="accent"
        accessibilityLabel={isLast ? 'Get started' : 'Continue'}
        style={{ minHeight: theme.space(AUTH_BUTTON_HEIGHT) }}
        onPress={() => {
          if (isLast) {
            onComplete();
            return;
          }
          setIndex(nextOnboardingPanel(index));
        }}
      >
        {isLast ? 'Get started' : 'Continue'}
      </Button>

      {/* Borderless for the same reason Login's "Create an account" is: it is a
          way out, not a second button peer in the stack. */}
      <Button
        variant="ghost"
        accessibilityLabel="Skip onboarding"
        style={{ borderWidth: 0, minHeight: theme.space(AUTH_BUTTON_HEIGHT) }}
        onPress={onComplete}
      >
        Skip
      </Button>
    </AuthShell>
  );
}
