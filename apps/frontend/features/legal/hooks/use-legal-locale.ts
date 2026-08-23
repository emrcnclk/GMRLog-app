import { asLegalLocale, DEFAULT_LEGAL_LOCALE, type LegalLocale } from '@gmrlog/types';
import { useQuery } from '@tanstack/react-query';

import { useApiClient } from '../../../src/api/api-provider';
import { useAuth } from '../../../src/auth/auth-provider';
import { queryKeys } from '../../../src/query/query-client';

export interface UseLegalLocaleResult {
  /** The locale to present and to record a decision against. */
  locale: LegalLocale;
  /**
   * False only while an authenticated player's recorded choice is still
   * unknown. A caller that is about to *write* a consent row should wait for
   * this rather than record against the fallback — see below.
   */
  isResolved: boolean;
}

/**
 * 12.4c — which translation of the legal documents this player actually chose.
 *
 * Registration writes the answer to `UserSettings.locale`, and until now
 * nothing read it back: the consent hooks defaulted to `'en'` and no caller
 * passed anything else, so a player who registered in Turkish was shown the
 * English Terms and got a `UserConsent.locale` row saying `'en'` — a record of
 * agreement to wording they never confirmed reading. `UserConsent.locale`
 * exists precisely because "a player who accepted the Turkish text agreed to
 * the Turkish wording" (schema.prisma), which only holds if the value is the
 * truth.
 *
 * Shares `queryKeys.settings` with `useSettings`, so this is the same cache
 * entry rather than a second request; whichever of the two mounts first warms
 * it for the other.
 *
 * `UserSettings.locale` is free text and may carry a region (`tr-TR`) or a
 * language the legal registry does not publish, so it goes through
 * `asLegalLocale` rather than a cast — an unpublishable value falls back the
 * same way the server's own resolver does.
 */
export function useLegalLocale(): UseLegalLocaleResult {
  const api = useApiClient();
  const { isAuthenticated } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.settings,
    enabled: isAuthenticated,
    queryFn: async () => {
      const envelope = await api.settings();
      return envelope.data;
    },
  });

  if (!isAuthenticated) {
    // A guest has no recorded choice to wait for. `isResolved` is true rather
    // than false so a pre-auth caller is never left waiting on a request this
    // hook will not make.
    return { locale: DEFAULT_LEGAL_LOCALE, isResolved: true };
  }

  return {
    locale: asLegalLocale(query.data?.appearance.locale) ?? DEFAULT_LEGAL_LOCALE,
    // A failed settings fetch settles too: it never resolves on its own, and
    // blocking the consent gate on it forever would be worse than presenting
    // the fallback locale the server would have served anyway.
    isResolved: !query.isPending,
  };
}
