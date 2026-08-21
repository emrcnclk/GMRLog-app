import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';

import { ACCEPTANCE_REQUIRED_DOCUMENT_IDS, resolveLegalDocument } from './documents';
import { LegalConsentService } from './legal-consent.service';
import {
  createFakeUserConsentRepository,
  type FakeUserConsentRepository,
} from './testing/fake-repositories';

const USER = 'user-1';

function currentAcceptance() {
  return ACCEPTANCE_REQUIRED_DOCUMENT_IDS.map((documentId) => {
    const document = resolveLegalDocument(documentId, 'en');
    if (document === null) {
      throw new Error(`missing legal document: ${documentId}`);
    }
    return { documentId, version: document.version, locale: 'en' as const };
  });
}

function currentVersionOf(documentId: (typeof ACCEPTANCE_REQUIRED_DOCUMENT_IDS)[number]): string {
  const document = resolveLegalDocument(documentId, 'en');
  if (document === null) {
    throw new Error(`missing legal document: ${documentId}`);
  }
  return document.version;
}

let repository: FakeUserConsentRepository;
let service: LegalConsentService;

beforeEach(() => {
  repository = createFakeUserConsentRepository();
  service = new LegalConsentService(repository);
});

describe('assertAcceptanceIsCurrent', () => {
  it('accepts a submission covering every required document at its current version', () => {
    expect(() => {
      service.assertAcceptanceIsCurrent(currentAcceptance());
    }).not.toThrow();
  });

  it('rejects a submission missing a required document', () => {
    const partial = currentAcceptance().slice(1);
    expect(() => {
      service.assertAcceptanceIsCurrent(partial);
    }).toThrow(BadRequestException);
  });

  it('rejects a stale version rather than silently recording it as the current one', () => {
    // A player who left the sign-up screen open across a deploy agreed to a
    // document that is no longer current. Recording that as consent to the new
    // version would put a false statement in the record that exists to be
    // evidence.
    const stale = currentAcceptance().map((entry, index) =>
      index === 0 ? { ...entry, version: '0.0.1' } : entry,
    );
    expect(() => {
      service.assertAcceptanceIsCurrent(stale);
    }).toThrow(/re-read and accept the current version/);
  });

  it('rejects a duplicate acceptance for the same document', () => {
    const accepted = currentAcceptance();
    const first = accepted[0];
    if (first === undefined) {
      throw new Error('no required documents');
    }
    expect(() => {
      service.assertAcceptanceIsCurrent([...accepted, first]);
    }).toThrow(/Duplicate acceptance/);
  });

  it('refuses acceptance of the disclosure notice', () => {
    // KVKK Art. 10 makes the Aydınlatma Metni a disclosure to be given, not a
    // bargain to agree to. Storing an "acceptance" of it would manufacture a
    // consent for processing that does not rest on consent.
    const notice = resolveLegalDocument('disclosure-notice', 'en');
    if (notice === null) {
      throw new Error('missing disclosure notice');
    }
    expect(() => {
      service.assertAcceptanceIsCurrent([
        ...currentAcceptance(),
        { documentId: 'disclosure-notice', version: notice.version, locale: 'en' },
      ]);
    }).toThrow(/not a document to accept/);
  });
});

describe('recordRegistrationConsent', () => {
  it('stores one accepted row per required document, with the locale shown', async () => {
    await service.recordRegistrationConsent(USER, currentAcceptance());

    const rows = await repository.listByUser(USER);
    expect(rows).toHaveLength(ACCEPTANCE_REQUIRED_DOCUMENT_IDS.length);
    for (const row of rows) {
      expect(row.decision).toBe('accepted');
      expect(row.locale).toBe('en');
      expect(row.consentKey).toBe(`${row.documentId}@${row.version}`);
    }
  });

  it('leaves the player satisfied with nothing outstanding', async () => {
    await service.recordRegistrationConsent(USER, currentAcceptance());

    const state = await service.getState(USER);
    expect(state.satisfied).toBe(true);
    expect(state.outstanding).toEqual([]);
  });
});

describe('getState', () => {
  it('reports every required document as outstanding for an account that never decided', async () => {
    // An OAuth sign-up, or an account older than the consent table. Silence is
    // not consent (F2.27 §7), so the absence of a row is not an acceptance.
    const state = await service.getState(USER);
    expect(state.satisfied).toBe(false);
    expect(state.outstanding.map((document) => document.id).sort()).toEqual(
      [...ACCEPTANCE_REQUIRED_DOCUMENT_IDS].sort(),
    );
  });

  it('does not carry an old acceptance forward across a version bump', async () => {
    await service.recordRegistrationConsent(
      USER,
      currentAcceptance().map((entry) => ({ ...entry, version: '0.0.1' })),
    );

    const state = await service.getState(USER);
    expect(state.satisfied).toBe(false);
    expect(state.outstanding).toHaveLength(ACCEPTANCE_REQUIRED_DOCUMENT_IDS.length);
    // The old decisions are still on record — history, not overwritten.
    expect(state.decisions).toHaveLength(ACCEPTANCE_REQUIRED_DOCUMENT_IDS.length);
  });

  it('treats a declined document as answered, not outstanding', async () => {
    // The behaviour this whole table exists for. A refusal that cannot be
    // recorded is indistinguishable from never having been asked, and the only
    // possible behaviour then is to ask again on every launch until the player
    // gives in — the dark pattern F2.27 §7 forbids.
    const terms = ACCEPTANCE_REQUIRED_DOCUMENT_IDS[0];
    if (terms === undefined) {
      throw new Error('no required documents');
    }

    await service.recordDecisions(USER, [
      {
        documentId: terms,
        version: currentVersionOf(terms),
        locale: 'en',
        decision: 'declined',
      },
    ]);

    const state = await service.getState(USER);
    expect(state.outstanding.map((document) => document.id)).not.toContain(terms);
    expect(state.satisfied).toBe(false);
  });

  it('separates "not asked" from "said no" — the two are different instructions', async () => {
    const [terms, privacy] = ACCEPTANCE_REQUIRED_DOCUMENT_IDS;
    if (terms === undefined || privacy === undefined) {
      throw new Error('expected two required documents');
    }

    await service.recordDecisions(USER, [
      { documentId: terms, version: currentVersionOf(terms), locale: 'en', decision: 'declined' },
    ]);

    const state = await service.getState(USER);
    // Declined: answered, so not asked again. Never decided: still outstanding.
    expect(state.outstanding.map((document) => document.id)).toEqual([privacy]);
  });

  it('reports a withdrawal as unsatisfied without re-prompting', async () => {
    const terms = ACCEPTANCE_REQUIRED_DOCUMENT_IDS[0];
    if (terms === undefined) {
      throw new Error('no required documents');
    }
    const version = currentVersionOf(terms);

    await service.recordDecisions(USER, [
      { documentId: terms, version, locale: 'en', decision: 'accepted' },
    ]);
    await service.recordDecisions(USER, [
      { documentId: terms, version, locale: 'en', decision: 'withdrawn' },
    ]);

    const state = await service.getState(USER);
    expect(state.satisfied).toBe(false);
    expect(state.outstanding.map((document) => document.id)).not.toContain(terms);
  });

  it('keeps one row per version, so a re-decision updates rather than accumulates', async () => {
    const terms = ACCEPTANCE_REQUIRED_DOCUMENT_IDS[0];
    if (terms === undefined) {
      throw new Error('no required documents');
    }
    const version = currentVersionOf(terms);

    await service.recordDecisions(USER, [
      { documentId: terms, version, locale: 'en', decision: 'accepted' },
    ]);
    await service.recordDecisions(USER, [
      { documentId: terms, version, locale: 'tr', decision: 'withdrawn' },
    ]);

    const rows = (await repository.listByUser(USER)).filter((row) => row.documentId === terms);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.decision).toBe('withdrawn');
    expect(rows[0]?.locale).toBe('tr');
  });
});

describe('recordDecisions', () => {
  it('refuses a decision against a superseded version', async () => {
    const terms = ACCEPTANCE_REQUIRED_DOCUMENT_IDS[0];
    if (terms === undefined) {
      throw new Error('no required documents');
    }

    await expect(
      service.recordDecisions(USER, [
        { documentId: terms, version: '0.0.1', locale: 'en', decision: 'accepted' },
      ]),
    ).rejects.toThrow(/decide against the current version/);
  });

  it('refuses a decision about the disclosure notice', async () => {
    const notice = resolveLegalDocument('disclosure-notice', 'en');
    if (notice === null) {
      throw new Error('missing disclosure notice');
    }

    await expect(
      service.recordDecisions(USER, [
        {
          documentId: 'disclosure-notice',
          version: notice.version,
          locale: 'en',
          decision: 'accepted',
        },
      ]),
    ).rejects.toThrow(/not a document to accept/);
  });

  it('returns the state after recording, so a caller needs no second call', async () => {
    const state = await service.recordDecisions(
      USER,
      currentAcceptance().map((entry) => ({
        ...entry,
        decision: 'accepted' as const,
      })),
    );

    expect(state.satisfied).toBe(true);
    expect(state.outstanding).toEqual([]);
  });
});
