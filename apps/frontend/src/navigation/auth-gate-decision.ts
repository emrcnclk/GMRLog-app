export type AuthGateDecision =
  | { action: 'wait' }
  | { action: 'allow' }
  | { action: 'replace'; href: '/(auth)' | '/(app)/(tabs)/home' };

/**
 * The protected route family — shared with `legal-consent-gate-decision.ts`
 * (12.4b) so the two gates never define "the app" two different ways. `legal`
 * is deliberately not a member: it lives at the root precisely so it is
 * reachable regardless of auth or consent state.
 */
export function isProtectedRouteSegment(rootSegment: string | undefined): boolean {
  return rootSegment === '(app)' || rootSegment === '(settings)' || rootSegment === '(modals)';
}

/**
 * Pure guard decision — tested without Expo Router / React Native.
 */
export function resolveAuthGate(input: {
  isBootstrapping: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  rootSegment: string | undefined;
}): AuthGateDecision {
  if (input.isBootstrapping) {
    return { action: 'wait' };
  }

  const inAuthGroup = input.rootSegment === '(auth)';
  const inAppGroup = isProtectedRouteSegment(input.rootSegment);

  if (input.isGuest && inAppGroup) {
    return { action: 'replace', href: '/(auth)' };
  }

  if (input.isAuthenticated && inAuthGroup) {
    return { action: 'replace', href: '/(app)/(tabs)/home' };
  }

  return { action: 'allow' };
}
