import type { LegalConsentDecisionValue, LegalDocumentId, LegalLocale } from '@gmrlog/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useApiClient } from '../../../src/api/api-provider';
import { useAuth } from '../../../src/auth/auth-provider';
import { queryKeys } from '../../../src/query/query-client';

import { useLegalLocale } from './use-legal-locale';

/**
 * 12.4b — this player's own consent state (12.2's public `/legal` listing is a
 * different query; this is the authenticated `/me` view of where they stand
 * against it).
 *
 * `enabled: isAuthenticated` rather than always-on: a guest has no consent
 * state to fetch, and firing the request anyway would just be an
 * unauthenticated call this route correctly rejects — noise, not a real check.
 */
export function useLegalConsentState(override?: LegalLocale) {
  const api = useApiClient();
  const { isAuthenticated } = useAuth();
  const player = useLegalLocale();
  const locale = override ?? player.locale;

  return useQuery({
    queryKey: queryKeys.legal.consentState(locale),
    // Also waits on the player's own locale when the caller named none.
    // Firing against the fallback first would answer for the wrong
    // translation, then answer again under a second query key once the real
    // one arrives — two states for one question, and the gate would have
    // rendered the first.
    enabled: isAuthenticated && (override !== undefined || player.isResolved),
    queryFn: async () => {
      const envelope = await api.getLegalConsents({ locale });
      return envelope.data;
    },
  });
}

/** 12.4b — accept, decline or withdraw the current version of a required document. */
export function useDecideLegalConsent(override?: LegalLocale) {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const player = useLegalLocale();
  const locale = override ?? player.locale;

  return useMutation({
    mutationFn: async (input: {
      documentId: LegalDocumentId;
      version: string;
      decision: LegalConsentDecisionValue;
    }) => {
      const envelope = await api.recordLegalConsents({
        decisions: [{ ...input, locale }],
      });
      return envelope.data;
    },
    onSuccess: (state) => {
      queryClient.setQueryData(queryKeys.legal.consentState(locale), state);
    },
  });
}

/**
 * 12.4b — record that one or more notices were displayed. Takes the whole
 * batch in one call because the gate discloses every undisclosed notice at
 * once (`resolveLegalConsentGate`), not one screen per document.
 */
export function useAcknowledgeLegalDocuments(override?: LegalLocale) {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const player = useLegalLocale();
  const locale = override ?? player.locale;

  return useMutation({
    mutationFn: async (documents: { documentId: LegalDocumentId; version: string }[]) => {
      const envelope = await api.acknowledgeLegalDocuments({
        documents: documents.map((document) => ({ ...document, locale })),
      });
      return envelope.data;
    },
    onSuccess: (state) => {
      queryClient.setQueryData(queryKeys.legal.consentState(locale), state);
    },
  });
}
