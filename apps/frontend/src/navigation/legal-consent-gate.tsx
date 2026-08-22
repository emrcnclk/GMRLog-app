import { useSegments } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';

import {
  useAcknowledgeLegalDocuments,
  useDecideLegalConsent,
  useLegalConsentState,
} from '../../features/legal/hooks/use-legal-consent-state';
import {
  BlockedGateScreen,
  DecideGateScreen,
  DiscloseGateScreen,
} from '../../features/legal/screens/legal-consent-gate-screen';
import { useAuth } from '../auth/auth-provider';

import { resolveLegalConsentGate } from './legal-consent-gate-decision';

export { resolveLegalConsentGate } from './legal-consent-gate-decision';
export type { LegalConsentGateDecision } from './legal-consent-gate-decision';

/**
 * 12.4b — the surface that closes the gap 12.4's own follow-up list left
 * open: `GET /me/legal-consents` correctly reports what is outstanding and
 * undisclosed, and nothing in the app called it. This is that caller.
 *
 * Sits inside `AuthGate` in `app/_layout.tsx`, after auth routing has
 * resolved — it only has an opinion once a player is authenticated and on a
 * protected route, which is exactly what `resolveLegalConsentGate` checks
 * before doing anything else.
 */
export function LegalConsentGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, logout } = useAuth();
  const segments = useSegments();
  const query = useLegalConsentState();
  const decide = useDecideLegalConsent();
  const acknowledge = useAcknowledgeLegalDocuments();

  // 12.4b — "review and accept" from the blocked screen needs to show the
  // decide screen for a document that is, by definition, in `blocked` rather
  // than `outstanding` (it already carries a decision). `resolveLegalConsentGate`
  // has no `blocked`-but-currently-being-reviewed state of its own — adding
  // one would mean the pure function has to know about a UI-only "let me look
  // again" gesture that never touches the server. Handling it here, ahead of
  // the pure decision, keeps that function honest about what the *server*
  // state means and keeps this the only place that knows about the gesture.
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const stopReviewing = useCallback(() => {
    setReviewingId(null);
  }, []);

  // Gated the same way `resolveLegalConsentGate` gates everything else below:
  // a logged-out player must never see this, even if `reviewingId` and a
  // stale cached `query.data` are both still sitting around from before they
  // signed out.
  const blockedDocument = isAuthenticated
    ? query.data?.blocked.find((document) => document.id === reviewingId)
    : undefined;

  if (blockedDocument !== undefined) {
    return (
      <DecideGateScreen
        document={blockedDocument}
        pending={decide.isPending}
        onAccept={() => {
          stopReviewing();
          decide.mutate({
            documentId: blockedDocument.id,
            version: blockedDocument.version,
            decision: 'accepted',
          });
        }}
        onDecline={() => {
          // Recorded again, then dropped back to the static consequence
          // screen — `resolveLegalConsentGate` reads the same `blocked` entry
          // and shows it below, so nothing loops.
          stopReviewing();
          decide.mutate({
            documentId: blockedDocument.id,
            version: blockedDocument.version,
            decision: 'declined',
          });
        }}
      />
    );
  }

  const decision = resolveLegalConsentGate({
    isAuthenticated,
    rootSegment: segments[0],
    isPending: query.isPending,
    isError: query.isError,
    outstanding: query.data?.outstanding ?? [],
    undisclosed: query.data?.undisclosed ?? [],
    blocked: query.data?.blocked ?? [],
  });

  if (decision.action === 'allow' || decision.action === 'wait') {
    // `wait` renders children rather than a spinner of its own: the query is
    // typically already warm by the time a player reaches a protected route
    // (bootstrap has already run), and a flash of a second loading screen
    // right after AuthGate's own would be worse than a brief pass-through.
    return children;
  }

  if (decision.action === 'disclose') {
    return (
      <DiscloseGateScreen
        documents={decision.documents}
        pending={acknowledge.isPending}
        onContinue={() => {
          acknowledge.mutate(
            decision.documents.map((document) => ({
              documentId: document.id,
              version: document.version,
            })),
          );
        }}
      />
    );
  }

  if (decision.action === 'decide') {
    return (
      <DecideGateScreen
        document={decision.document}
        pending={decide.isPending}
        onAccept={() => {
          decide.mutate({
            documentId: decision.document.id,
            version: decision.document.version,
            decision: 'accepted',
          });
        }}
        onDecline={() => {
          decide.mutate({
            documentId: decision.document.id,
            version: decision.document.version,
            decision: 'declined',
          });
        }}
      />
    );
  }

  return (
    <BlockedGateScreen
      document={decision.document}
      onReview={() => {
        setReviewingId(decision.document.id);
      }}
      onLogOut={() => {
        void logout();
      }}
    />
  );
}
