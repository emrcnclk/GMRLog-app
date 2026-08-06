import { Loading, Screen } from '@gmrlog/ui';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { createExpoSecureStorage } from '../../lib/storage/expo-secure-storage';
import type { SecureStorage } from '../../lib/storage/secure-storage';

import { OnboardingScreen } from './onboarding-screen';
import { loadOnboardingSeen, saveOnboardingSeen } from './storage/onboarding-seen';

export interface OnboardingGateProps {
  /** The guest entry the panels stand in front of — Login. */
  children: ReactNode;
  /** Injected in tests; production reads the app's own secure storage. */
  storage?: SecureStorage;
}

/**
 * `SCREEN_REDESIGNS.md` §3 via 0.1 — this task "owns whatever decides when
 * onboarding is shown and when it is done". Three decisions, all made here:
 *
 * **When.** Before sign-in, in front of the guest entry. The three panels are
 * the product's pitch — what the record is, what the profile answers, where the
 * next game comes from — and that is an argument you make to someone who has not
 * signed up, not a tour you give after they have. It also means Phase 4's OAuth
 * flows inherit it for free: everything guest-facing sits behind this one gate.
 *
 * **Where.** Not a route. It renders *instead of* its children on the group's
 * own entry, so nothing is pushed onto the Stack: there is no onboarding entry
 * in the back stack to return to, no second route for `AuthGate` to reason
 * about, and no navigation between the panels and Login — the same "swap the
 * content, keep the shell" move §1 already makes for Login's email mode.
 *
 * **When it is done.** On the last panel's button or on Skip, either way one
 * bit written to storage. Written *before* the swap so a player who closes the
 * app on the seam does not meet the panels again.
 *
 * The loading state is not decoration: the flag is read asynchronously, and the
 * two wrong answers are a flash of Login in front of a first-time player or a
 * flash of the panels in front of a returning one. It uses the same
 * `Loading`-in-a-`Screen` vocabulary the three route groups already use while
 * the session resolves.
 */
export function OnboardingGate({ children, storage }: OnboardingGateProps) {
  const store = useMemo(() => storage ?? createExpoSecureStorage(), [storage]);
  const [seen, setSeen] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadOnboardingSeen(store).then((value) => {
      if (!cancelled) {
        setSeen(value);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [store]);

  const complete = useCallback(() => {
    // The local swap does not wait on the write: storage is the record, not the
    // gate, and a slow keychain must not hold the button. A failed write costs
    // one extra showing on next launch, which is the safe direction to fail.
    void saveOnboardingSeen(store);
    setSeen(true);
  }, [store]);

  if (seen === null) {
    return (
      <Screen>
        <Loading label="Starting GMRLOG" />
      </Screen>
    );
  }

  if (!seen) {
    return <OnboardingScreen onComplete={complete} />;
  }

  return <>{children}</>;
}
