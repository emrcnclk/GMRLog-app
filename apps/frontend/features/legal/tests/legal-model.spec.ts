import { describe, expect, it } from 'vitest';

import { resolveAuthGate } from '../../../src/navigation/auth-gate-decision';
import {
  LEGAL_ROUTES,
  legalRoute,
  legalVersionLine,
  parseLegalDocumentId,
  resolveLegalView,
} from '../model/legal-model';

describe('legal routes', () => {
  it('names one route per document', () => {
    expect(Object.values(LEGAL_ROUTES)).toEqual([
      '/legal/terms-of-service',
      '/legal/privacy-policy',
      '/legal/disclosure-notice',
    ]);
  });

  it('builds the same path the route map holds', () => {
    expect(legalRoute('privacy-policy')).toBe(LEGAL_ROUTES.privacy);
  });

  it('is reachable from both sides of the auth gate', () => {
    // The whole reason the reader lives at the root instead of inside (auth)
    // or (settings): a guest must reach it from the sign-in screen and an
    // authenticated player from Settings, with one screen and no redirect.
    const guest = resolveAuthGate({
      isBootstrapping: false,
      isAuthenticated: false,
      isGuest: true,
      rootSegment: 'legal',
    });
    const member = resolveAuthGate({
      isBootstrapping: false,
      isAuthenticated: true,
      isGuest: false,
      rootSegment: 'legal',
    });

    expect(guest.action).toBe('allow');
    expect(member.action).toBe('allow');
  });
});

describe('parseLegalDocumentId', () => {
  it('accepts the three known ids', () => {
    expect(parseLegalDocumentId('terms-of-service')).toBe('terms-of-service');
    expect(parseLegalDocumentId('privacy-policy')).toBe('privacy-policy');
    expect(parseLegalDocumentId('disclosure-notice')).toBe('disclosure-notice');
  });

  it('takes the first value when the router hands back an array', () => {
    expect(parseLegalDocumentId(['privacy-policy'])).toBe('privacy-policy');
  });

  it('returns null rather than defaulting to a document the reader did not ask for', () => {
    expect(parseLegalDocumentId('cookie-policy')).toBeNull();
    expect(parseLegalDocumentId(undefined)).toBeNull();
    expect(parseLegalDocumentId('')).toBeNull();
  });
});

describe('resolveLegalView', () => {
  const document = {
    title: 'Privacy Policy',
    version: '1.0.0',
    effectiveDate: '2026-08-21',
    body: '# Privacy Policy\n\nBody.',
  };

  it('is ready once a body has arrived', () => {
    const view = resolveLegalView({
      isPending: false,
      isError: false,
      isOnline: true,
      document,
    });
    expect(view.status).toBe('ready');
    expect(view.title).toBe('Privacy Policy');
  });

  it('loads while pending', () => {
    expect(
      resolveLegalView({ isPending: true, isError: false, isOnline: true, document: null }).status,
    ).toBe('loading');
  });

  it('reports offline before error, because an offline request fails fast', () => {
    // "You are offline" and "something went wrong" are different instructions:
    // one is fixed by reconnecting, the other by retrying.
    expect(
      resolveLegalView({ isPending: false, isError: true, isOnline: false, document: null }).status,
    ).toBe('offline');
  });

  it('reports error when online and the request failed', () => {
    expect(
      resolveLegalView({ isPending: false, isError: true, isOnline: true, document: null }).status,
    ).toBe('error');
  });

  it('reports empty for a document that resolves with no body', () => {
    expect(
      resolveLegalView({
        isPending: false,
        isError: false,
        isOnline: true,
        document: { ...document, body: '   ' },
      }).status,
    ).toBe('empty');
  });

  it('keeps showing a loaded document even if a refetch fails', () => {
    // A reader mid-document must not have the text yanked out from under them
    // because a background refresh failed.
    const view = resolveLegalView({
      isPending: false,
      isError: true,
      isOnline: true,
      document,
    });
    expect(view.status).toBe('ready');
  });

  it('never leaves the caller without one of the five states', () => {
    const view = resolveLegalView({
      isPending: false,
      isError: false,
      isOnline: true,
      document: null,
    });
    expect(['loading', 'offline', 'error', 'empty', 'ready']).toContain(view.status);
  });
});

describe('legalVersionLine', () => {
  it('pairs the version with a readable effective date', () => {
    const line = legalVersionLine('1.0.0', '2026-08-21');
    expect(line.startsWith('1.0.0 · ')).toBe(true);
    expect(line).toContain('2026');
  });

  it('falls back to the bare version when the date is unusable', () => {
    expect(legalVersionLine('1.0.0', 'not-a-date')).toBe('1.0.0');
  });

  it('is empty when there is no version yet', () => {
    expect(legalVersionLine('', '2026-08-21')).toBe('');
  });
});
