import { describe, expect, it } from 'vitest';

import {
  CONSISTENCY_AUDIT_MATRIX,
  SCREEN_VIEW_STATES,
  assertConsistencyRow,
} from './consistency-audit';
import {
  A11Y_REQUIRED_PRIMARY_ACTIONS,
  BUNDLE_HARDENING_GUARDS,
  MIN_TOUCH_TARGET,
  PERFORMANCE_AUDIT_TARGETS,
  meetsTouchTarget,
} from './a11y-perf-audit';

describe('D3.16 loading empty error ready consistency', () => {
  it('uses canonical four view states', () => {
    expect(SCREEN_VIEW_STATES).toEqual(['loading', 'empty', 'error', 'ready']);
  });

  it('passes consistency matrix without Alert()', () => {
    const failures = CONSISTENCY_AUDIT_MATRIX.flatMap(assertConsistencyRow);
    expect(failures).toEqual([]);
    expect(CONSISTENCY_AUDIT_MATRIX.every((row) => row.usesAlert === false)).toBe(true);
  });
});

describe('D3.16 accessibility and performance audit', () => {
  it('requires Sign in among primary a11y labels', () => {
    expect(A11Y_REQUIRED_PRIMARY_ACTIONS).toContain('Sign in');
    expect(A11Y_REQUIRED_PRIMARY_ACTIONS).toContain('Sign up');
    expect(meetsTouchTarget(MIN_TOUCH_TARGET)).toBe(true);
    expect(meetsTouchTarget(43)).toBe(false);
  });

  it('lists performance and bundle hardening targets', () => {
    expect(PERFORMANCE_AUDIT_TARGETS).toContain('cold-start');
    expect(BUNDLE_HARDENING_GUARDS).toContain('No Alert()');
    expect(BUNDLE_HARDENING_GUARDS).toContain('Dead lib/ shims removed');
  });
});
