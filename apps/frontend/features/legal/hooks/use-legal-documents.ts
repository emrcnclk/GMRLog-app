import type { LegalDocumentSummaryResponse, LegalLocale } from '@gmrlog/types';
import { useQuery } from '@tanstack/react-query';

import { useApiClient } from '../../../src/api/api-provider';
import { queryKeys } from '../../../src/query/query-client';

const DEFAULT_LOCALE: LegalLocale = 'en';

export interface UseLegalDocumentsResult {
  documents: LegalDocumentSummaryResponse[];
  /** The documents a new account must accept, at their current versions. */
  acceptance: {
    documentId: LegalDocumentSummaryResponse['id'];
    version: string;
    locale: LegalLocale;
  }[];
  isPending: boolean;
  isError: boolean;
}

/**
 * 12.4 — every legal document's current version, without bodies.
 *
 * This is what the sign-up screen sends back as its acceptance: the versions it
 * actually had in front of the player, not a value the client made up. It is
 * also the cheap call a launched app makes to notice a version bump.
 *
 * Public, so it works before an account exists — which is the whole reason
 * `/legal` takes no token.
 */
export function useLegalDocuments(locale: LegalLocale = DEFAULT_LOCALE): UseLegalDocumentsResult {
  const api = useApiClient();

  const query = useQuery({
    queryKey: queryKeys.legal.list(locale),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const envelope = await api.listLegalDocuments({ locale });
      return envelope.data;
    },
  });

  const documents = query.data ?? [];

  return {
    documents,
    acceptance: documents
      .filter((document) => document.requiresAcceptance)
      .map((document) => ({
        documentId: document.id,
        version: document.version,
        locale: document.locale,
      })),
    isPending: query.isPending,
    isError: query.isError,
  };
}
