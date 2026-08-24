import { describe, expect, it } from 'vitest';

import {
  isRegisterStepComplete,
  isRegisterSubmitDisabled,
  REGISTER_STEPS,
  REGISTER_SUBTITLE,
} from './register-steps';

const VALID = {
  displayName: 'Emircan',
  handle: 'emircan_01',
  email: 'player@example.com',
  password: 'a-long-enough-password',
  birthDate: '1995-06-15',
  countryCode: 'TR',
  locale: 'en',
};

/** 12.4c — the profile step's own values, all five of them. */
const PROFILE = {
  birthDate: '1995-06-15',
  countryCode: 'TR',
  locale: 'en',
};

/**
 * §2's progressive disclosure, pinned. The screen itself cannot be imported into
 * vitest — it pulls React Native through `@gmrlog/ui` — so the step model lives
 * in a plain module and the contract is tested there, the same split
 * `auth-layout.ts` uses for §1's constants.
 */
describe('register steps', () => {
  it('discloses four steps, handle before email before profile before password', () => {
    // §2 named three. 12.4c added a fourth for the birth date, country and
    // language registration now asks for; the doc describes a form that no
    // longer exists. Order still matters: the profile step sits third, after
    // the account is described and before the password.
    expect(REGISTER_STEPS).toHaveLength(4);
    expect(REGISTER_STEPS[0]?.fields).toContain('handle');
    expect(REGISTER_STEPS[1]?.fields).toEqual(['email']);
    expect(REGISTER_STEPS[2]?.id).toBe('profile');
    expect(REGISTER_STEPS[3]?.fields).toEqual(['password']);
  });

  it('names the real step count in the sign-up subtitle', () => {
    // The screen said "Three steps" while the indicator under it read "Step 1
    // of 4" — 12.4c added the fourth step and left the prose behind. Found by
    // rendering the screen, not by a test, which is why there is one now.
    const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six'];
    expect(REGISTER_SUBTITLE.toLowerCase()).toContain(
      `${String(words[REGISTER_STEPS.length])} steps`,
    );
  });

  it('covers every text field exactly once — none dropped, none asked twice', () => {
    // `fields` drives the generic TextField loop, so it holds only text inputs.
    // The profile step's birth date, country and language are gated by the same
    // picked schema but rendered by their own controls.
    const fields = REGISTER_STEPS.flatMap((step) => step.fields);
    expect([...fields].sort()).toEqual([
      'displayName',
      'email',
      'firstName',
      'handle',
      'lastName',
      'password',
    ]);
  });

  it('lets the profile step through with no real name given', () => {
    // Optional means optional: a player who wants to give neither name must be
    // able to continue, which is the whole reason those two fields are not
    // required.
    expect(isRegisterStepComplete(2, PROFILE)).toBe(true);
  });

  it('holds the profile step shut until the birth date and country are given', () => {
    expect(isRegisterStepComplete(2, { locale: 'en' })).toBe(false);
    expect(isRegisterStepComplete(2, { ...PROFILE, birthDate: '' })).toBe(false);
    expect(isRegisterStepComplete(2, { ...PROFILE, countryCode: '' })).toBe(false);
  });

  it('holds the profile step shut for someone under 13', () => {
    // The floor the Terms have claimed since 12.1, now enforced at the step
    // rather than only at the server.
    const today = new Date();
    const nearlyThirteen = new Date(
      Date.UTC(today.getUTCFullYear() - 13, today.getUTCMonth(), today.getUTCDate() + 1),
    );
    expect(
      isRegisterStepComplete(2, {
        ...PROFILE,
        birthDate: nearlyThirteen.toISOString().slice(0, 10),
      }),
    ).toBe(false);
  });

  it('keeps the last step on the submit label', () => {
    expect(REGISTER_STEPS.at(-1)?.action).toBe('Create account');
  });

  it('holds every step shut while its own fields are empty', () => {
    expect(isRegisterStepComplete(0, {})).toBe(false);
    expect(isRegisterStepComplete(1, {})).toBe(false);
    expect(isRegisterStepComplete(2, {})).toBe(false);
    expect(isRegisterStepComplete(3, {})).toBe(false);
  });

  it('opens a step on its own fields alone, not on the whole form', () => {
    // The point of the picked schemas: step one must not wait on a password.
    expect(isRegisterStepComplete(0, { displayName: 'Emircan', handle: 'emircan_01' })).toBe(true);
    expect(isRegisterStepComplete(1, { email: 'player@example.com' })).toBe(true);
    expect(isRegisterStepComplete(3, { password: 'a-long-enough-password' })).toBe(true);
  });

  it('applies the shared validator, not a second set of rules', () => {
    // handleSchema: /^[a-z0-9_]{3,24}$/ — the capital and the dash both fail.
    expect(isRegisterStepComplete(0, { displayName: 'Emircan', handle: 'Emir-can' })).toBe(false);
    expect(isRegisterStepComplete(1, { email: 'not-an-email' })).toBe(false);
    // passwordPolicySchema: 12 characters.
    expect(isRegisterStepComplete(3, { password: 'short' })).toBe(false);
  });

  it('requires the display name the schema requires, even though §2 names three steps', () => {
    expect(isRegisterStepComplete(0, { handle: 'emircan_01' })).toBe(false);
  });

  it('accepts the full set of values on the final step', () => {
    expect(isRegisterStepComplete(3, VALID)).toBe(true);
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
