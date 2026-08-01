/**
 * D3.16 loading / empty / error / ready / offline consistency vocabulary.
 */

export const SCREEN_VIEW_STATES = ['loading', 'empty', 'error', 'ready'] as const;

export type ScreenViewState = (typeof SCREEN_VIEW_STATES)[number];

export interface ConsistencyAuditRow {
  surface: string;
  hasLoading: boolean;
  hasEmpty: boolean;
  hasError: boolean;
  hasReady: boolean;
  offlineAware: boolean;
  usesErrorBanner: boolean;
  usesAlert: boolean;
}

/** Canonical surfaces audited in D3.16 — no product behavior change. */
export const CONSISTENCY_AUDIT_MATRIX: readonly ConsistencyAuditRow[] = [
  {
    surface: 'home',
    hasLoading: true,
    hasEmpty: true,
    hasError: true,
    hasReady: true,
    offlineAware: true,
    usesErrorBanner: true,
    usesAlert: false,
  },
  {
    surface: 'discover',
    hasLoading: true,
    hasEmpty: true,
    hasError: true,
    hasReady: true,
    offlineAware: true,
    usesErrorBanner: true,
    usesAlert: false,
  },
  {
    surface: 'search',
    hasLoading: true,
    hasEmpty: true,
    hasError: true,
    hasReady: true,
    offlineAware: true,
    usesErrorBanner: true,
    usesAlert: false,
  },
  {
    surface: 'notifications',
    hasLoading: true,
    hasEmpty: true,
    hasError: true,
    hasReady: true,
    offlineAware: true,
    usesErrorBanner: true,
    usesAlert: false,
  },
  {
    surface: 'profile',
    hasLoading: true,
    hasEmpty: true,
    hasError: true,
    hasReady: true,
    offlineAware: true,
    usesErrorBanner: true,
    usesAlert: false,
  },
  {
    surface: 'communities',
    hasLoading: true,
    hasEmpty: true,
    hasError: true,
    hasReady: true,
    offlineAware: true,
    usesErrorBanner: true,
    usesAlert: false,
  },
  {
    surface: 'events',
    hasLoading: true,
    hasEmpty: true,
    hasError: true,
    hasReady: true,
    offlineAware: true,
    usesErrorBanner: true,
    usesAlert: false,
  },
  {
    surface: 'settings',
    hasLoading: true,
    hasEmpty: true,
    hasError: true,
    hasReady: true,
    offlineAware: true,
    usesErrorBanner: true,
    usesAlert: false,
  },
  {
    surface: 'messages',
    hasLoading: true,
    hasEmpty: true,
    hasError: true,
    hasReady: true,
    offlineAware: true,
    usesErrorBanner: true,
    usesAlert: false,
  },
  {
    surface: 'auth.login',
    hasLoading: true,
    hasEmpty: false,
    hasError: true,
    hasReady: true,
    offlineAware: true,
    usesErrorBanner: true,
    usesAlert: false,
  },
] as const;

export function assertConsistencyRow(row: ConsistencyAuditRow): string[] {
  const failures: string[] = [];
  if (!row.hasLoading) {
    failures.push(`${row.surface}: missing loading`);
  }
  if (!row.hasError) {
    failures.push(`${row.surface}: missing error`);
  }
  if (!row.hasReady) {
    failures.push(`${row.surface}: missing ready`);
  }
  if (!row.usesErrorBanner) {
    failures.push(`${row.surface}: must use ErrorBanner`);
  }
  if (row.usesAlert) {
    failures.push(`${row.surface}: Alert() forbidden`);
  }
  return failures;
}
