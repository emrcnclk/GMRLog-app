import { LEGAL_DOCUMENT_IDS, LEGAL_LOCALES } from '@gmrlog/types';
import { describe, expect, it } from 'vitest';

import {
  ACCEPTANCE_REQUIRED_DOCUMENT_IDS,
  DEFAULT_LEGAL_LOCALE,
  LEGAL_DOCUMENTS,
  findLegalDocument,
  legalConsentKey,
  parseLegalVersion,
  requiresReconsent,
  resolveLegalDocument,
} from './index';

describe('legal document registry', () => {
  it('publishes every document in every locale', () => {
    for (const id of LEGAL_DOCUMENT_IDS) {
      for (const locale of LEGAL_LOCALES) {
        expect(findLegalDocument(id, locale), `${id} is missing in ${locale}`).not.toBeNull();
      }
    }

    expect(LEGAL_DOCUMENTS).toHaveLength(LEGAL_DOCUMENT_IDS.length * LEGAL_LOCALES.length);
  });

  it('holds one entry per id and locale, with no duplicates', () => {
    const keys = LEGAL_DOCUMENTS.map((document) => `${document.id}:${document.locale}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('keeps every locale of a document on the same version and effective date', () => {
    // A translation that lags behind its source is the failure this pins: a
    // reader switching locale would otherwise silently be shown an older set
    // of terms while their consent record says they accepted the newer one.
    for (const id of LEGAL_DOCUMENT_IDS) {
      const versions = new Set(
        LEGAL_DOCUMENTS.filter((document) => document.id === id).map(
          (document) => `${document.version}|${document.effectiveDate}`,
        ),
      );
      expect(versions.size, `${id} has drifted between locales`).toBe(1);
    }
  });

  it('gives every document a parseable version and an ISO effective date', () => {
    for (const document of LEGAL_DOCUMENTS) {
      expect(parseLegalVersion(document.version), document.version).not.toBeNull();
      expect(document.effectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(document.title.trim().length).toBeGreaterThan(0);
      expect(document.body.trim().length).toBeGreaterThan(0);
    }
  });

  it('requires acceptance of the terms and the privacy policy, but not the disclosure notice', () => {
    // KVKK Art. 10 makes the Aydınlatma Metni a disclosure to be given, not a
    // bargain to agree to. Attaching an accept control to it would manufacture
    // a consent for processing that does not rest on consent.
    expect([...ACCEPTANCE_REQUIRED_DOCUMENT_IDS].sort()).toEqual([
      'privacy-policy',
      'terms-of-service',
    ]);

    for (const document of LEGAL_DOCUMENTS) {
      expect(document.requiresAcceptance, `${document.id}/${document.locale}`).toBe(
        document.id !== 'disclosure-notice',
      );
    }
  });
});

describe('resolveLegalDocument', () => {
  it('returns the requested locale when it is published', () => {
    expect(resolveLegalDocument('terms-of-service', 'tr')?.locale).toBe('tr');
  });

  it('falls back to the default locale rather than 404ing a document that exists', () => {
    const resolved = resolveLegalDocument('privacy-policy', 'de' as never);
    expect(resolved?.id).toBe('privacy-policy');
    expect(resolved?.locale).toBe(DEFAULT_LEGAL_LOCALE);
  });

  it('returns null for a document that does not exist at all', () => {
    expect(resolveLegalDocument('cookie-policy' as never)).toBeNull();
  });
});

describe('legalConsentKey', () => {
  it('builds the string 12.4 persists', () => {
    expect(legalConsentKey('privacy-policy', '1.0.0')).toBe('privacy-policy@1.0.0');
  });
});

describe('parseLegalVersion', () => {
  it('splits a semantic version into its parts', () => {
    expect(parseLegalVersion('2.13.4')).toEqual({ major: 2, minor: 13, patch: 4 });
  });

  it.each(['1.0', '1.0.0.0', 'v1.0.0', '1.0.0-draft', '', 'latest'])(
    'rejects %o',
    (version: string) => {
      expect(parseLegalVersion(version)).toBeNull();
    },
  );
});

describe('requiresReconsent', () => {
  it('does not ask again for a patch bump', () => {
    // A patch cannot alter what a reader agreed to — a typo, a broken link, a
    // translation fix. Asking again would train players to click through.
    expect(requiresReconsent('1.0.0', '1.0.3')).toBe(false);
  });

  it('asks again for a minor bump', () => {
    expect(requiresReconsent('1.0.0', '1.1.0')).toBe(true);
  });

  it('asks again for a major bump', () => {
    expect(requiresReconsent('1.4.2', '2.0.0')).toBe(true);
  });

  it('treats a missing acceptance as stale', () => {
    expect(requiresReconsent(null, '1.0.0')).toBe(true);
    expect(requiresReconsent(undefined, '1.0.0')).toBe(true);
  });

  it('treats an unreadable acceptance as stale rather than throwing', () => {
    // Not knowing what someone accepted is the same position as their having
    // accepted nothing; the safe resolution is to ask again.
    expect(requiresReconsent('garbage', '1.0.0')).toBe(true);
    expect(requiresReconsent('1.0.0', 'garbage')).toBe(true);
  });

  it('does not go stale against itself', () => {
    for (const document of LEGAL_DOCUMENTS) {
      expect(requiresReconsent(document.version, document.version)).toBe(false);
    }
  });
});

describe('document bodies', () => {
  it('carry the placeholders that must be filled before publication', () => {
    // These are deliberately unresolved: inventing a legal entity name, a
    // registered address or a governing jurisdiction would be worse than
    // leaving the gap visible. This test exists so the gap cannot be forgotten
    // — when the real values land, the assertion flips to expect none.
    const unresolved = LEGAL_DOCUMENTS.filter((document) =>
      /\[(LEGAL ENTITY NAME|REGISTERED ADDRESS|GOVERNING JURISDICTION)\]/.test(document.body),
    );

    expect(unresolved).toHaveLength(LEGAL_DOCUMENTS.length);
  });

  it('do not claim a self-serve export or deletion route while 12.5/12.6 are unbuilt', () => {
    // Phase 12's gate, pinned rather than trusted to review. The backend has no
    // export route and no account-deletion route; a policy that describes one
    // is the exact defect that opened this phase.
    for (const document of LEGAL_DOCUMENTS) {
      expect(document.body, `${document.id}/${document.locale}`).not.toMatch(
        /\/api\/v1\/[a-z/-]*(export|delete)/i,
      );
    }
  });

  it('open with a heading and state their own version', () => {
    for (const document of LEGAL_DOCUMENTS) {
      expect(document.body.startsWith('# ')).toBe(true);
      expect(document.body).toContain(document.version);
    }
  });
});
