import type { LegalDocumentSummaryResponse } from '@gmrlog/types';

import { isProtectedRouteSegment } from './auth-gate-decision';

export type LegalConsentGateDecision =
  | { action: 'allow' }
  | { action: 'wait' }
  | { action: 'disclose'; documents: LegalDocumentSummaryResponse[] }
  | { action: 'decide'; document: LegalDocumentSummaryResponse }
  | { action: 'blocked'; document: LegalDocumentSummaryResponse };

/**
 * 12.4b — pure gate decision, tested without Expo Router, React Native or a
 * network call.
 *
 * Only guards the protected route family (`isProtectedRouteSegment`) — the
 * same family `resolveAuthGate` guards, so `legal` and the auth screens stay
 * reachable regardless of consent state, which matters concretely: a player
 * mid-gate must be able to tap through to the full text without the gate
 * fighting itself.
 *
 * Order of the three non-`allow` outcomes, and why it is this order and not
 * another:
 *
 * 1. **`disclose`** first. A notice costs the player nothing to clear — there
 *    is no decision, only a "continue" — so resolving it before anything else
 *    means a player who is also outstanding or blocked sees the cheapest
 *    screen first, not the most demanding one.
 * 2. **`decide`** next, ahead of `blocked`. A never-asked player is not yet in
 *    conflict with the product; asking is the default path, and it should
 *    read as a first request, not as an argument.
 * 3. **`blocked`** last. It is shown only once every lower-friction path has
 *    been exhausted, and only to a player who has already said no to
 *    something GMRLog cannot run without.
 *
 * `isError` fails **open** (`allow`), deliberately. Blocking the entire app
 * because one query failed would be a materially worse failure than letting a
 * player in with a stale consent state for one session — the same reasoning
 * `query-client.ts`'s "automatic retry is off" decision already applies to
 * every list and detail screen in the app. The gate re-checks on the next
 * launch; it does not hold a player hostage to a transient network error.
 */
export function resolveLegalConsentGate(input: {
  isAuthenticated: boolean;
  rootSegment: string | undefined;
  isPending: boolean;
  isError: boolean;
  outstanding: readonly LegalDocumentSummaryResponse[];
  undisclosed: readonly LegalDocumentSummaryResponse[];
  blocked: readonly LegalDocumentSummaryResponse[];
}): LegalConsentGateDecision {
  if (!input.isAuthenticated || !isProtectedRouteSegment(input.rootSegment)) {
    return { action: 'allow' };
  }

  if (input.isPending) {
    return { action: 'wait' };
  }

  if (input.isError) {
    return { action: 'allow' };
  }

  if (input.undisclosed.length > 0) {
    return { action: 'disclose', documents: [...input.undisclosed] };
  }

  const nextOutstanding = input.outstanding[0];
  if (nextOutstanding !== undefined) {
    return { action: 'decide', document: nextOutstanding };
  }

  const nextBlocked = input.blocked[0];
  if (nextBlocked !== undefined) {
    return { action: 'blocked', document: nextBlocked };
  }

  return { action: 'allow' };
}
