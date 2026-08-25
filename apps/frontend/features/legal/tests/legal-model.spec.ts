import { describe, expect, it } from 'vitest';

import { resolveAuthGate } from '../../../src/navigation/auth-gate-decision';
import {
  LEGAL_ROUTES,
  legalRoute,
  legalVersionLine,
  parseLegalDocumentId,
  resolveLegalView,
  stripLegalFrontMatter,
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

describe('stripLegalFrontMatter', () => {
  // The duplication the live render pass reported and left as a composition
  // call: every document opens with its own title and provenance, and the
  // reader's `ScreenTitle` shows the same three values above it.
  const body = [
    '# Terms of Service',
    '',
    '**Effective date:** 21 August 2026',
    '',
    '**Version:** 1.0.0',
    '',
    '## 1. What this is',
    '',
    'These terms are the agreement between you and GMRLog.',
  ].join('\n');

  it('drops the title and both provenance lines', () => {
    const stripped = stripLegalFrontMatter(body);

    expect(stripped.startsWith('## 1. What this is')).toBe(true);
    expect(stripped).not.toContain('# Terms of Service');
    expect(stripped).not.toContain('**Version:**');
    expect(stripped).not.toContain('**Effective date:**');
  });

  it('keeps every word of the document itself', () => {
    expect(stripLegalFrontMatter(body)).toContain(
      'These terms are the agreement between you and GMRLog.',
    );
  });

  // The Turkish documents carry the same shape with different labels, so the
  // rule has to be structural rather than a list of English words.
  it('works on the Turkish documents, whose labels differ', () => {
    const tr = [
      '# Kullanım Koşulları',
      '',
      '**Yürürlük tarihi:** 21 Ağustos 2026',
      '',
      '**Sürüm:** 1.0.0',
      '',
      '## 1. Bu metin nedir',
    ].join('\n');

    expect(stripLegalFrontMatter(tr)).toBe('## 1. Bu metin nedir');
  });

  it('leaves a body that does not open with a title alone', () => {
    const plain = 'This notice is given under Article 10.';

    expect(stripLegalFrontMatter(plain)).toBe(plain);
  });

  // Stops at the first line that is neither blank nor metadata, so a bold run
  // inside the text is never mistaken for provenance.
  it('never eats into the text past the first real line', () => {
    const withBold = [
      '# Privacy Policy',
      '',
      '**Version:** 1.3.0',
      '',
      'GMRLog is the controller.',
      '',
      '**Note:** this line is prose.',
    ].join('\n');

    expect(stripLegalFrontMatter(withBold)).toContain('**Note:** this line is prose.');
  });

  it('is what the reader renders, not the raw body', () => {
    const view = resolveLegalView({
      isPending: false,
      isError: false,
      isOnline: true,
      document: { title: 'Terms of Service', version: '1.0.0', effectiveDate: '2026-08-21', body },
    });

    expect(view.status).toBe('ready');
    expect(view.body.startsWith('## 1. What this is')).toBe(true);
    // The chrome still shows all three, from the structured fields.
    expect(view.title).toBe('Terms of Service');
    expect(view.version).toBe('1.0.0');
  });
});
