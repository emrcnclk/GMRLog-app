import { describe, expect, it } from 'vitest';

import { isRegisterStepComplete, isRegisterSubmitDisabled, REGISTER_STEPS } from './register-steps';

const VALID = {
  displayName: 'Emircan',
  handle: 'emircan_01',
  email: 'player@example.com',
  password: 'a-long-enough-password',
};

/**
 * §2's progressive disclosure, pinned. The screen itself cannot be imported into
 * vitest — it pulls React Native through `@gmrlog/ui` — so the step model lives
 * in a plain module and the contract is tested there, the same split
 * `auth-layout.ts` uses for §1's constants.
 */
describe('register steps', () => {
  it('discloses three steps in §2 order, handle before email before password', () => {
    expect(REGISTER_STEPS).toHaveLength(3);
    expect(REGISTER_STEPS[1]?.fields).toEqual(['email']);
    expect(REGISTER_STEPS[2]?.fields).toEqual(['password']);
    expect(REGISTER_STEPS[0]?.fields).toContain('handle');
  });

  it('covers every schema field exactly once — none dropped, none asked twice', () => {
    const fields = REGISTER_STEPS.flatMap((step) => step.fields);
    expect([...fields].sort()).toEqual(['displayName', 'email', 'handle', 'password']);
  });

  it('keeps the last step on the submit label', () => {
    expect(REGISTER_STEPS.at(-1)?.action).toBe('Create account');
  });

  it('holds every step shut while its own fields are empty', () => {
    expect(isRegisterStepComplete(0, {})).toBe(false);
    expect(isRegisterStepComplete(1, {})).toBe(false);
    expect(isRegisterStepComplete(2, {})).toBe(false);
  });

  it('opens a step on its own fields alone, not on the whole form', () => {
    // The point of the picked schemas: step one must not wait on a password.
    expect(isRegisterStepComplete(0, { displayName: 'Emircan', handle: 'emircan_01' })).toBe(true);
    expect(isRegisterStepComplete(1, { email: 'player@example.com' })).toBe(true);
    expect(isRegisterStepComplete(2, { password: 'a-long-enough-password' })).toBe(true);
  });

  it('applies the shared validator, not a second set of rules', () => {
    // handleSchema: /^[a-z0-9_]{3,24}$/ — the capital and the dash both fail.
    expect(isRegisterStepComplete(0, { displayName: 'Emircan', handle: 'Emir-can' })).toBe(false);
    expect(isRegisterStepComplete(1, { email: 'not-an-email' })).toBe(false);
    // passwordPolicySchema: 12 characters.
    expect(isRegisterStepComplete(2, { password: 'short' })).toBe(false);
  });

  it('requires the display name the schema requires, even though §2 names three steps', () => {
    expect(isRegisterStepComplete(0, { handle: 'emircan_01' })).toBe(false);
  });

  it('accepts the full set of values on the final step', () => {
    expect(isRegisterStepComplete(2, VALID)).toBe(true);
  });

  it('returns false for an index outside the flow', () => {
    expect(isRegisterStepComplete(-1, VALID)).toBe(false);
    expect(isRegisterStepComplete(REGISTER_STEPS.length, VALID)).toBe(false);
  });
});

describe('isRegisterSubmitDisabled', () => {
  const ready = {
    busy: false,
    stepComplete: true,
    isLastStep: true,
    isFormValid: true,
    legalReady: true,
    termsAccepted: true,
  };

  it('enables the submit once the form and the legal listing are both ready', () => {
    expect(isRegisterSubmitDisabled(ready)).toBe(false);
  });

  it('keeps the submit disabled until the legal documents have loaded', () => {
    // 12.4's rule. A player cannot agree to a document the app has not shown
    // them, and submitting without the versions would either fail server-side
    // or record consent to something never displayed.
    expect(isRegisterSubmitDisabled({ ...ready, legalReady: false })).toBe(true);
  });

  it('does not gate the earlier steps on the legal listing', () => {
    // The listing is only needed at submit. Blocking step one on it would make
    // a slow network look like a broken form.
    expect(isRegisterSubmitDisabled({ ...ready, isLastStep: false, legalReady: false })).toBe(
      false,
    );
  });

  it('stays disabled while busy or while the step is incomplete', () => {
    expect(isRegisterSubmitDisabled({ ...ready, busy: true })).toBe(true);
    expect(isRegisterSubmitDisabled({ ...ready, stepComplete: false })).toBe(true);
  });

  it('stays disabled on the last step when the form is invalid', () => {
    expect(isRegisterSubmitDisabled({ ...ready, isFormValid: false })).toBe(true);
  });
});
