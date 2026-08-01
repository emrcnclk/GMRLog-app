export type AuthGateDecision =
  | { action: 'wait' }
  | { action: 'allow' }
  | { action: 'replace'; href: '/(auth)' | '/(app)/(tabs)/home' };

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
  const inAppGroup =
    input.rootSegment === '(app)' ||
    input.rootSegment === '(settings)' ||
    input.rootSegment === '(modals)';

  if (input.isGuest && inAppGroup) {
    return { action: 'replace', href: '/(auth)' };
  }

  if (input.isAuthenticated && inAuthGroup) {
    return { action: 'replace', href: '/(app)/(tabs)/home' };
  }

  return { action: 'allow' };
}
