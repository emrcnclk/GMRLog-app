import { LEGAL_DOCUMENT_IDS, type LegalDocumentId } from '@gmrlog/types';
import { BadRequestException } from '@nestjs/common';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ACCEPTANCE_REQUIRED_DOCUMENT_IDS,
  DISCLOSURE_DOCUMENT_IDS,
  resolveLegalDocument,
} from './documents';
import { LegalConsentService } from './legal-consent.service';
import {
  createFakeUserConsentRepository,
  type FakeUserConsentRepository,
} from './testing/fake-repositories';

// resolveLegalDocument is wrapped in a spy so a single test (the patch-bump
// reconsent case below) can stand up a "current" version that does not exist
// in the real registry, without disturbing every other test in this file —
// the default implementation just forwards to the real one.
vi.mock('./documents', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./documents')>();
  return { ...actual, resolveLegalDocument: vi.fn(actual.resolveLegalDocument) };
});

const USER = 'user-1';

function currentVersionOf(documentId: LegalDocumentId): string {
  const document = resolveLegalDocument(documentId, 'en');
  if (document === null) {
    throw new Error(`missing legal document: ${documentId}`);
  }
  return document.version;
}

/** Everything the sign-up screen displays, at its current version. */
function currentShownDocuments() {
  return LEGAL_DOCUMENT_IDS.map((documentId) => ({
    documentId,
    version: currentVersionOf(documentId),
    locale: 'en' as const,
  }));
}

let repository: FakeUserConsentRepository;
let service: LegalConsentService;
let realResolveLegalDocument: typeof resolveLegalDocument;

beforeAll(async () => {
  ({ resolveLegalDocument: realResolveLegalDocument } =
    await vi.importActual<typeof import('./documents')>('./documents'));
});

beforeEach(() => {
  repository = createFakeUserConsentRepository();
  service = new LegalConsentService(repository);
});

afterEach(() => {
  vi.mocked(resolveLegalDocument).mockImplementation(realResolveLegalDocument);
});

describe('the acceptance / disclosure split', () => {
  it('treats only the Terms of Service as a contract', () => {
    // 12.4a. A privacy notice is given under GDPR Art. 13/14 and KVKK Art. 10,
    // not agreed to; 12.4 had the Privacy Policy on the wrong side of this.
    expect([...ACCEPTANCE_REQUIRED_DOCUMENT_IDS]).toEqual(['terms-of-service']);
  });

  it('treats both notices as disclosures', () => {
    expect([...DISCLOSURE_DOCUMENT_IDS].sort()).toEqual(['disclosure-notice', 'privacy-policy']);
  });

  it('leaves no document in both lists or neither', () => {
    const union = [...ACCEPTANCE_REQUIRED_DOCUMENT_IDS, ...DISCLOSURE_DOCUMENT_IDS].sort();
    expect(union).toEqual([...LEGAL_DOCUMENT_IDS].sort());
    expect(new Set(union).size).toBe(union.length);
  });
});

describe('assertShownDocumentsAreCurrent', () => {
  it('accepts a submission covering every document at its current version', () => {
    expect(() => {
      service.assertShownDocumentsAreCurrent(currentShownDocuments());
    }).not.toThrow();
  });

  it('rejects a submission missing the terms', () => {
    const partial = currentShownDocuments().filter(
      (entry) => entry.documentId !== 'terms-of-service',
    );
    expect(() => {
      service.assertShownDocumentsAreCurrent(partial);
    }).toThrow(/Acceptance of terms-of-service is required/);
  });

  it('rejects a submission missing a notice, because an unshown notice was not given', () => {
    // The disclosure obligation is discharged by displaying the text, not by
    // having a copy on a server somewhere.
    const partial = currentShownDocuments().filter(
      (entry) => entry.documentId !== 'privacy-policy',
    );
    expect(() => {
      service.assertShownDocumentsAreCurrent(partial);
    }).toThrow(/must be shown before an account is created/);
  });

  it('rejects a stale version rather than silently recording it as the current one', () => {
    const stale = currentShownDocuments().map((entry, index) =>
      index === 0 ? { ...entry, version: '0.0.1' } : entry,
    );
    expect(() => {
      service.assertShownDocumentsAreCurrent(stale);
    }).toThrow(/re-read the current version/);
  });

  it('rejects a duplicate entry for the same document', () => {
    const shown = currentShownDocuments();
    const first = shown[0];
    if (first === undefined) {
      throw new Error('no documents');
    }
    expect(() => {
      service.assertShownDocumentsAreCurrent([...shown, first]);
    }).toThrow(/Duplicate entry/);
  });

  it('rejects a document that does not exist', () => {
    expect(() => {
      service.assertShownDocumentsAreCurrent([
        ...currentShownDocuments(),
        { documentId: 'cookie-policy' as LegalDocumentId, version: '1.0.0', locale: 'en' },
      ]);
    }).toThrow(BadRequestException);
  });
});

describe('recordRegistrationConsent', () => {
  it('accepts the contract and acknowledges the notices', async () => {
    // The verdict is derived from the document, never sent by the client, so a
    // client cannot mislabel a privacy notice as consent.
    await service.recordRegistrationConsent(USER, currentShownDocuments());

    const rows = await repository.listByUser(USER);
    expect(rows).toHaveLength(LEGAL_DOCUMENT_IDS.length);

    for (const row of rows) {
      expect(row.decision).toBe(
        row.documentId === 'terms-of-service' ? 'accepted' : 'acknowledged',
      );
      expect(row.locale).toBe('en');
      expect(row.consentKey).toBe(`${row.documentId}@${row.version}`);
    }
  });

  it('leaves the player satisfied, with nothing outstanding, blocked or undisclosed', async () => {
    await service.recordRegistrationConsent(USER, currentShownDocuments());

    const state = await service.getState(USER);
    expect(state.satisfied).toBe(true);
    expect(state.outstanding).toEqual([]);
    expect(state.blocked).toEqual([]);
    expect(state.undisclosed).toEqual([]);
  });
});

describe('getState', () => {
  it('reports an account that never decided as unsatisfied, asked and undisclosed', async () => {
    // An OAuth sign-up, or an account older than the consent table.
    const state = await service.getState(USER);
    expect(state.satisfied).toBe(false);
    expect(state.outstanding.map((document) => document.id)).toEqual(['terms-of-service']);
    expect(state.blocked).toEqual([]);
    expect(state.undisclosed.map((document) => document.id).sort()).toEqual([
      'disclosure-notice',
      'privacy-policy',
    ]);
  });

  it('never puts a notice in outstanding or blocked — the remedy is to show it, not to ask', async () => {
    // Asking for agreement to a privacy notice would be asking for something it
    // is not lawful to ask for. The three lists carry different instructions.
    const state = await service.getState(USER);
    for (const document of [...state.outstanding, ...state.blocked]) {
      expect(document.requiresAcceptance).toBe(true);
    }
    for (const document of state.undisclosed) {
      expect(document.requiresAcceptance).toBe(false);
    }
  });

  it('does not carry an old record forward across a version bump', async () => {
    await service.recordRegistrationConsent(
      USER,
      currentShownDocuments().map((entry) => ({ ...entry, version: '0.0.1' })),
    );

    const state = await service.getState(USER);
    expect(state.satisfied).toBe(false);
    expect(state.outstanding.map((document) => document.id)).toEqual(['terms-of-service']);
    // Not blocked: the old row was `accepted`, just at a superseded version —
    // never having decided about the current one is "ask again", not "no".
    expect(state.blocked).toEqual([]);
    expect(state.undisclosed).toHaveLength(DISCLOSURE_DOCUMENT_IDS.length);
    // The old rows are still on record — history, not overwritten.
    expect(state.decisions).toHaveLength(LEGAL_DOCUMENT_IDS.length);
  });

  it('carries an accepted decision forward across a patch bump, per requiresReconsent', async () => {
    // requiresReconsent('1.0.0', '1.0.1') is false — a patch cannot alter what
    // was agreed to. getState must honour that instead of flagging every
    // patch release as a fresh outstanding acceptance.
    const version = currentVersionOf('terms-of-service');
    const [major, minor, patch] = version.split('.').map(Number) as [number, number, number];
    const bumpedVersion = `${String(major)}.${String(minor)}.${String(patch + 1)}`;

    await service.recordDecisions(USER, [
      { documentId: 'terms-of-service', version, locale: 'en', decision: 'accepted' },
    ]);

    vi.mocked(resolveLegalDocument).mockImplementation((id, locale) => {
      const document = realResolveLegalDocument(id, locale);
      if (document === null || id !== 'terms-of-service') {
        return document;
      }
      return { ...document, version: bumpedVersion };
    });

    const state = await service.getState(USER);

    expect(state.outstanding).toEqual([]);
    expect(state.blocked).toEqual([]);
    expect(state.satisfied).toBe(true);
  });

  it('treats a declined contract as answered, not outstanding — but does not let it through, either', async () => {
    // The behaviour the decision enum exists for. A refusal that cannot be
    // recorded is indistinguishable from never having been asked, and the only
    // possible behaviour then is to ask again on every launch until the player
    // gives in — the dark pattern F2.27 §7 forbids. But "don't nag" is not the
    // same claim as "let them in anyway": `blocked` is the piece 12.4b added so
    // a caller can tell the two apart.
    await service.recordDecisions(USER, [
      {
        documentId: 'terms-of-service',
        version: currentVersionOf('terms-of-service'),
        locale: 'en',
        decision: 'declined',
      },
    ]);

    const state = await service.getState(USER);
    expect(state.outstanding).toEqual([]);
    expect(state.blocked.map((document) => document.id)).toEqual(['terms-of-service']);
    expect(state.satisfied).toBe(false);
  });

  it('reports a withdrawal as unsatisfied and blocked, without re-prompting', async () => {
    const version = currentVersionOf('terms-of-service');

    await service.recordDecisions(USER, [
      { documentId: 'terms-of-service', version, locale: 'en', decision: 'accepted' },
    ]);
    await service.recordDecisions(USER, [
      { documentId: 'terms-of-service', version, locale: 'en', decision: 'withdrawn' },
    ]);

    const state = await service.getState(USER);
    expect(state.satisfied).toBe(false);
    expect(state.outstanding).toEqual([]);
    expect(state.blocked.map((document) => document.id)).toEqual(['terms-of-service']);
  });

  it('keeps one row per version, so a re-decision updates rather than accumulates', async () => {
    const version = currentVersionOf('terms-of-service');

    await service.recordDecisions(USER, [
      { documentId: 'terms-of-service', version, locale: 'en', decision: 'accepted' },
    ]);
    await service.recordDecisions(USER, [
      { documentId: 'terms-of-service', version, locale: 'tr', decision: 'withdrawn' },
    ]);

    const rows = (await repository.listByUser(USER)).filter(
      (row) => row.documentId === 'terms-of-service',
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.decision).toBe('withdrawn');
    expect(rows[0]?.locale).toBe('tr');
  });
});

describe('recordDecisions', () => {
  it('refuses a decision against a superseded version', async () => {
    await expect(
      service.recordDecisions(USER, [
        { documentId: 'terms-of-service', version: '0.0.1', locale: 'en', decision: 'accepted' },
      ]),
    ).rejects.toThrow(/decide against the current version/);
  });

  it('refuses a decision about a notice', async () => {
    // There is nothing to decide. Storing an "acceptance" of a privacy notice
    // would manufacture a consent for processing that does not rest on consent.
    await expect(
      service.recordDecisions(USER, [
        {
          documentId: 'privacy-policy',
          version: currentVersionOf('privacy-policy'),
          locale: 'en',
          decision: 'accepted',
        },
      ]),
    ).rejects.toThrow(/not a document to accept/);
  });

  it('returns the state after recording, so a caller needs no second call', async () => {
    const state = await service.recordDecisions(USER, [
      {
        documentId: 'terms-of-service',
        version: currentVersionOf('terms-of-service'),
        locale: 'en',
        decision: 'accepted',
      },
    ]);

    expect(state.satisfied).toBe(true);
    expect(state.outstanding).toEqual([]);
  });
});

describe('acknowledgeDisclosures', () => {
  // 12.4b — the gap 12.4a left open: recordRegistrationConsent writes an
  // acknowledged row for a notice shown at sign-up, but nothing wrote one for
  // a notice shown afterwards. This is that path.

  it('clears undisclosed notices without touching the terms', async () => {
    const state = await service.acknowledgeDisclosures(USER, [
      { documentId: 'privacy-policy', version: currentVersionOf('privacy-policy'), locale: 'en' },
      {
        documentId: 'disclosure-notice',
        version: currentVersionOf('disclosure-notice'),
        locale: 'en',
      },
    ]);

    expect(state.undisclosed).toEqual([]);
    // Still outstanding: acknowledging a notice is not a decision about the
    // Terms, and must not be mistaken for one.
    expect(state.outstanding.map((document) => document.id)).toEqual(['terms-of-service']);
  });

  it('records the acknowledgement as evidence, not silently', async () => {
    await service.acknowledgeDisclosures(USER, [
      { documentId: 'privacy-policy', version: currentVersionOf('privacy-policy'), locale: 'en' },
    ]);

    const rows = await repository.listByUser(USER);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.decision).toBe('acknowledged');
  });

  it('refuses a document that requires acceptance — that is what recordDecisions is for', async () => {
    await expect(
      service.acknowledgeDisclosures(USER, [
        {
          documentId: 'terms-of-service',
          version: currentVersionOf('terms-of-service'),
          locale: 'en',
        },
      ]),
    ).rejects.toThrow(/not a document to accept/);
  });

  it('refuses a superseded version rather than recording it as current', async () => {
    await expect(
      service.acknowledgeDisclosures(USER, [
        { documentId: 'privacy-policy', version: '0.0.1', locale: 'en' },
      ]),
    ).rejects.toThrow(/show the current version/);
  });

  it('refuses an unknown document', async () => {
    await expect(
      service.acknowledgeDisclosures(USER, [
        { documentId: 'cookie-policy' as LegalDocumentId, version: '1.0.0', locale: 'en' },
      ]),
    ).rejects.toThrow(BadRequestException);
  });

  it('returns the state after recording, so a caller needs no second call', async () => {
    const state = await service.acknowledgeDisclosures(USER, [
      { documentId: 'privacy-policy', version: currentVersionOf('privacy-policy'), locale: 'en' },
      {
        documentId: 'disclosure-notice',
        version: currentVersionOf('disclosure-notice'),
        locale: 'en',
      },
    ]);

    expect(state.undisclosed).toEqual([]);
  });
});
