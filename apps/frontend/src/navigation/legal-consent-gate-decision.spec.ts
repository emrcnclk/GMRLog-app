import type { LegalDocumentSummaryResponse } from '@gmrlog/types';
import { describe, expect, it } from 'vitest';

import { resolveLegalConsentGate } from './legal-consent-gate-decision';

function doc(id: string, requiresAcceptance: boolean): LegalDocumentSummaryResponse {
  return {
    id: id as LegalDocumentSummaryResponse['id'],
    locale: 'en',
    version: '1.0.0',
    effectiveDate: '2026-08-22',
    title: id,
    requiresAcceptance,
  };
}

const READY = {
  isAuthenticated: true,
  rootSegment: '(app)',
  isPending: false,
  isError: false,
  outstanding: [],
  undisclosed: [],
  blocked: [],
};

describe('resolveLegalConsentGate', () => {
  it('allows a guest through untouched — there is no consent state for someone with no account', () => {
    expect(
      resolveLegalConsentGate({
        ...READY,
        isAuthenticated: false,
        outstanding: [doc('terms-of-service', true)],
      }),
    ).toEqual({ action: 'allow' });
  });

  it('allows every route outside the protected family, regardless of state', () => {
    // `legal` in particular: a player mid-gate must be able to tap through to
    // the full text without the gate fighting itself.
    for (const rootSegment of [undefined, '(auth)', 'legal', 'index']) {
      expect(
        resolveLegalConsentGate({
          ...READY,
          rootSegment,
          outstanding: [doc('terms-of-service', true)],
        }),
      ).toEqual({ action: 'allow' });
    }
  });

  it('waits while the consent query is still pending', () => {
    expect(resolveLegalConsentGate({ ...READY, isPending: true })).toEqual({ action: 'wait' });
  });

  it('fails open on a query error rather than locking a player out of the whole app', () => {
    // The same reasoning query-client.ts's "automatic retry is off" decision
    // already applies everywhere else: a transient failure should not hold a
    // player hostage when the gate re-checks on the very next launch.
    expect(
      resolveLegalConsentGate({
        ...READY,
        isError: true,
        outstanding: [doc('terms-of-service', true)],
      }),
    ).toEqual({ action: 'allow' });
  });

  it('asks to disclose an undisclosed notice, ahead of everything else', () => {
    const privacy = doc('privacy-policy', false);
    const result = resolveLegalConsentGate({
      ...READY,
      undisclosed: [privacy],
      outstanding: [doc('terms-of-service', true)],
      blocked: [doc('terms-of-service', true)],
    });
    expect(result).toEqual({ action: 'disclose', documents: [privacy] });
  });

  it('passes every undisclosed document at once, not one at a time', () => {
    const privacy = doc('privacy-policy', false);
    const notice = doc('disclosure-notice', false);
    const result = resolveLegalConsentGate({ ...READY, undisclosed: [privacy, notice] });
    expect(result).toEqual({ action: 'disclose', documents: [privacy, notice] });
  });

  it('asks about an outstanding document once nothing is undisclosed', () => {
    const terms = doc('terms-of-service', true);
    expect(resolveLegalConsentGate({ ...READY, outstanding: [terms] })).toEqual({
      action: 'decide',
      document: terms,
    });
  });

  it('prefers decide over blocked — a never-asked player is not yet in conflict', () => {
    const terms = doc('terms-of-service', true);
    const result = resolveLegalConsentGate({
      ...READY,
      outstanding: [terms],
      blocked: [doc('terms-of-service', true)],
    });
    expect(result.action).toBe('decide');
  });

  it('shows the blocked consequence only once outstanding and undisclosed are both empty', () => {
    const terms = doc('terms-of-service', true);
    expect(resolveLegalConsentGate({ ...READY, blocked: [terms] })).toEqual({
      action: 'blocked',
      document: terms,
    });
  });

  it('allows through once nothing is outstanding, undisclosed or blocked', () => {
    expect(resolveLegalConsentGate(READY)).toEqual({ action: 'allow' });
  });
});
