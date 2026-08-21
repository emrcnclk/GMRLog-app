import type { LegalDocumentId, LegalLocale } from '@gmrlog/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useApiClient } from '../../../src/api/api-provider';
import { queryKeys } from '../../../src/query/query-client';
import { useConnectivityStore } from '../../../src/state/stores';
import { resolveLegalView, type LegalViewModel } from '../model/legal-model';

const DEFAULT_LOCALE: LegalLocale = 'en';

export interface UseLegalDocumentResult extends LegalViewModel {
  refresh: () => Promise<void>;
}

/**
 * 12.3 — one legal document, fetched from 12.2's public route.
 *
 * No token is attached and none is needed; the reader must work for a visitor
 * on the sign-in screen. Note what that means for failures: a 401 is not a
 * possible outcome here, so nothing in this path should treat one as a session
 * problem.
 *
 * `staleTime` is deliberately short rather than infinite. The documents change
 * rarely, but when one does change it takes a version bump with it, and 12.4
 * raises re-consent off exactly that version — a reader holding a cached copy
 * of a superseded document for a whole session is the failure worth avoiding.
 * It mirrors the five minutes the server's own `Cache-Control` allows.
 */
export function useLegalDocument(
  document: LegalDocumentId | null,
  locale: LegalLocale = DEFAULT_LOCALE,
): UseLegalDocumentResult {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const isOnline = useConnectivityStore((state) => state.isOnline);

  const query = useQuery({
    queryKey: queryKeys.legal.document(document ?? 'unknown', locale),
    enabled: document !== null,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (document === null) {
        return null;
      }
      const envelope = await api.getLegalDocument(document, { locale });
      return envelope.data;
    },
  });

  const view = resolveLegalView({
    // A null document never runs the query, so `isPending` stays true forever.
    // Treat it as settled so the screen can show its not-found state instead
    // of spinning at a reader who followed a broken link.
    isPending: document !== null && query.isPending,
    isError: query.isError,
    isOnline,
    document: query.data ?? null,
  });

  const refresh = useCallback(async () => {
    if (document === null) {
      return;
    }
    await queryClient.invalidateQueries({
      queryKey: queryKeys.legal.document(document, locale),
    });
  }, [document, locale, queryClient]);

  return { ...view, refresh };
}
