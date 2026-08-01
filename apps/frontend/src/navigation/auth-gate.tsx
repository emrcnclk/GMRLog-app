import { Loading, Screen } from '@gmrlog/ui';
import { Redirect, useRootNavigationState, useSegments } from 'expo-router';
import type { ReactNode } from 'react';

import { useAuth } from '../auth/auth-provider';

import { resolveAuthGate } from './auth-gate-decision';

export type { AuthGateDecision } from './auth-gate-decision';
export { resolveAuthGate } from './auth-gate-decision';

/**
 * `useRootNavigationState()` is untyped in expo-router; a `key` is only present
 * once the root navigator has mounted.
 */
function useNavigationReady(): boolean {
  const rootNavigationState = useRootNavigationState() as { key?: string } | undefined;
  return typeof rootNavigationState?.key === 'string';
}

/**
 * Redirects guests away from protected routes and authenticated users
 * away from (auth) after bootstrap — no flash of wrong group.
 *
 * Uses declarative `<Redirect>` (not `router.replace`) so Expo Router web
 * never navigates before the root layout navigator is mounted.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { isBootstrapping, isAuthenticated, isGuest } = useAuth();
  const segments = useSegments();
  const navigationReady = useNavigationReady();

  if (!navigationReady || isBootstrapping) {
    return children;
  }

  const decision = resolveAuthGate({
    isBootstrapping,
    isAuthenticated,
    isGuest,
    rootSegment: segments[0],
  });

  if (decision.action === 'replace') {
    return (
      <>
        {children}
        <Redirect href={decision.href} />
      </>
    );
  }

  return children;
}

/** Splash bootstrap redirect. */
export function BootstrapRedirect() {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const navigationReady = useNavigationReady();
  if (isBootstrapping || !navigationReady) {
    return (
      <Screen>
        <Loading label="Starting GMRLOG" />
      </Screen>
    );
  }
  return <Redirect href={isAuthenticated ? '/(app)/(tabs)/home' : '/(auth)'} />;
}
