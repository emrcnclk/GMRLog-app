import type { LegalDocumentId } from '@gmrlog/types';

/**
 * 12.3 — the in-app legal reader's route and view model. Pure: no React, no
 * Expo Router, so the routing decisions below are testable without either.
 */

/**
 * Routes live at the root, outside `(auth)` and `(app)`, on purpose.
 *
 * `resolveAuthGate` (`src/navigation/auth-gate-decision.ts`) redirects a guest
 * out of `(app)`/`(settings)`/`(modals)` and an authenticated user out of
 * `(auth)`. A `legal` root segment matches neither group, so it resolves to
 * `allow` for both — which is exactly what this surface needs: the same
 * document, reachable from the sign-in screen and from Settings, with no
 * redirect and no duplicated screen.
 */
export const LEGAL_ROUTES = {
  terms: '/legal/terms-of-service',
  privacy: '/legal/privacy-policy',
  disclosure: '/legal/disclosure-notice',
} as const;

export function legalRoute(document: LegalDocumentId): string {
  return `/legal/${document}`;
}

const KNOWN_DOCUMENT_IDS: readonly LegalDocumentId[] = [
  'terms-of-service',
  'privacy-policy',
  'disclosure-notice',
];

/**
 * Narrows an Expo Router path param to a document id.
 *
 * Returns `null` rather than defaulting to the terms: a deep link to
 * `/legal/anything` must not quietly serve a document the reader did not ask
 * for. The screen renders its not-found state instead.
 */
export function parseLegalDocumentId(raw: string | string[] | undefined): LegalDocumentId | null {
  const value = Array.isArray(raw) ? raw[0] : raw;

  if (value === undefined) {
    return null;
  }

  return KNOWN_DOCUMENT_IDS.find((id) => id === value) ?? null;
}

export type LegalViewStatus = 'loading' | 'offline' | 'error' | 'empty' | 'ready';

export interface LegalViewModel {
  status: LegalViewStatus;
  body: string;
  title: string;
  version: string;
  effectiveDate: string;
}

/**
 * Resolves the reader's state.
 *
 * `offline` is separated from `error` deliberately — CLAUDE.md's rule is that
 * no screen may drop a state in a recomposition, and "you are offline" is a
 * different instruction to the reader than "something went wrong": one is
 * fixed by reconnecting, the other by retrying. The offline branch is checked
 * before the error branch because an offline request fails fast in the axios
 * client, and reporting that as a generic failure would send the reader
 * looking for a problem that is not there.
 *
 * `empty` exists for a document that resolves but carries no body. It should
 * be unreachable — 12.1's registry test asserts every body is non-empty — but
 * a blank legal screen with no explanation is the worst of the failure modes,
 * so it gets a state rather than rendering nothing.
 */
export function resolveLegalView(input: {
  isPending: boolean;
  isError: boolean;
  isOnline: boolean;
  document: { title: string; version: string; effectiveDate: string; body: string } | null;
}): LegalViewModel {
  const base = {
    body: input.document?.body ?? '',
    title: input.document?.title ?? '',
    version: input.document?.version ?? '',
    effectiveDate: input.document?.effectiveDate ?? '',
  };

  if (input.document !== null && input.document.body.trim().length > 0) {
    return { status: 'ready', ...base };
  }

  if (input.isPending) {
    return { status: 'loading', ...base };
  }

  if (!input.isOnline) {
    return { status: 'offline', ...base };
  }

  if (input.isError) {
    return { status: 'error', ...base };
  }

  if (input.document !== null) {
    return { status: 'empty', ...base };
  }

  return { status: 'error', ...base };
}

/** `1.0.0 · 21 August 2026` — the reader's provenance line. */
export function legalVersionLine(version: string, effectiveDate: string): string {
  if (version.length === 0) {
    return '';
  }

  const date = new Date(effectiveDate);

  if (Number.isNaN(date.getTime())) {
    return version;
  }

  return `${version} · ${date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })}`;
}
