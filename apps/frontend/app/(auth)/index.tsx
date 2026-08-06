import { LoginScreen } from '../../features/auth/login-screen';
import { OnboardingGate } from '../../features/onboarding/onboarding-gate';

/**
 * Guest auth entry — production login (D3.2), behind §3's onboarding panels.
 *
 * The gate renders the panels *instead of* Login on a first run rather than
 * pushing a route, so onboarding never enters the back stack and `AuthGate` has
 * one guest surface to reason about, not two.
 */
export default function AuthIndexRoute() {
  return (
    <OnboardingGate>
      <LoginScreen />
    </OnboardingGate>
  );
}
