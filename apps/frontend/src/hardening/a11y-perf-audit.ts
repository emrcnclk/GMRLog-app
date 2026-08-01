/**
 * D3.16 accessibility / performance / bundle hardening contracts.
 */

export const MIN_TOUCH_TARGET = 44;

export const A11Y_REQUIRED_PRIMARY_ACTIONS = [
  'Sign in',
  'Sign up',
  'Log out',
  'Retry',
  'Reload',
] as const;

export const PERFORMANCE_AUDIT_TARGETS = [
  'cold-start',
  'tab-switch',
  'list-rendering',
  'image-loading',
  'query-hydration',
] as const;

export const BUNDLE_HARDENING_GUARDS = [
  'No Alert()',
  'Monitoring providers disabled',
  'Production logger silent',
  'Dead lib/ shims removed',
  'OfflineBoundary is no-op',
] as const;

export function meetsTouchTarget(size: number): boolean {
  return size >= MIN_TOUCH_TARGET;
}
