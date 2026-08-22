import {
  LEGAL_DOCUMENT_IDS,
  type LegalConsentKey,
  type LegalDocumentId,
  type LegalDocumentVersion,
  type LegalDocumentVersionString,
  type LegalLocale,
} from '@gmrlog/types';

import { disclosureNoticeEn } from './disclosure-notice.en';
import { disclosureNoticeTr } from './disclosure-notice.tr';
import type { LegalDocumentDefinition } from './legal-document.types';
import { privacyPolicyEn } from './privacy-policy.en';
import { privacyPolicyTr } from './privacy-policy.tr';
import { termsOfServiceEn } from './terms-of-service.en';
import { termsOfServiceTr } from './terms-of-service.tr';

/**
 * 12.1 — the registry. Every legal document, in every locale, at its current
 * version. 12.2 serves from here; 12.4 records against the keys built here.
 */
export const LEGAL_DOCUMENTS: readonly LegalDocumentDefinition[] = [
  termsOfServiceEn,
  termsOfServiceTr,
  privacyPolicyEn,
  privacyPolicyTr,
  disclosureNoticeEn,
  disclosureNoticeTr,
] as const;

/**
 * 12.1 — the locale served when a request names none, or names one we do not
 * publish. English rather than Turkish because the product UI is English; the
 * Turkish Aydınlatma Metni remains the operative text for KVKK purposes
 * regardless of which locale a given reader is served.
 */
export const DEFAULT_LEGAL_LOCALE: LegalLocale = 'en';

/**
 * 12.1 — the documents a new account must accept. Derived from the documents
 * themselves rather than restated, so a document cannot be added to the
 * registry with `requiresAcceptance: true` and then be silently missing from
 * the sign-up flow.
 *
 * Neither the Aydınlatma Metni nor the Privacy Policy is here. KVKK Art. 10 and
 * GDPR Art. 13/14 make a privacy notice a disclosure to be *given*, distinct
 * from consent; attaching an accept control to one manufactures a consent for
 * processing that does not rest on consent. **Only the Terms of Service are a
 * contract, and only a contract is accepted** — 12.4a corrected the Privacy
 * Policy, which 12.4 had on the wrong side of this line.
 */
export const ACCEPTANCE_REQUIRED_DOCUMENT_IDS: readonly LegalDocumentId[] =
  LEGAL_DOCUMENT_IDS.filter((id) =>
    LEGAL_DOCUMENTS.some((document) => document.id === id && document.requiresAcceptance),
  );

/**
 * 12.4a — the documents that are *given*, not agreed to.
 *
 * The complement of the list above, derived the same way rather than restated,
 * so a document can never fall into both lists or neither. The Privacy Policy
 * and the Aydınlatma Metni live here: GDPR Art. 13/14 and KVKK Art. 10 make a
 * privacy notice a disclosure obligation, and the reader is informed rather
 * than asked. They are still shown at sign-up and their display is still
 * recorded — as an acknowledgement, which is evidence of disclosure and not
 * permission for anything.
 */
export const DISCLOSURE_DOCUMENT_IDS: readonly LegalDocumentId[] = LEGAL_DOCUMENT_IDS.filter(
  (id) => !ACCEPTANCE_REQUIRED_DOCUMENT_IDS.includes(id),
);

/**
 * 12.4a — what recording the display of a document means, given what kind of
 * document it is. One place, so no caller has to decide.
 */
export function decisionForDisplayedDocument(id: LegalDocumentId): 'accepted' | 'acknowledged' {
  return ACCEPTANCE_REQUIRED_DOCUMENT_IDS.includes(id) ? 'accepted' : 'acknowledged';
}

/** 12.1 — one document in one locale, or `null` if that pairing is not published. */
export function findLegalDocument(
  id: LegalDocumentId,
  locale: LegalLocale = DEFAULT_LEGAL_LOCALE,
): LegalDocumentDefinition | null {
  return (
    LEGAL_DOCUMENTS.find((document) => document.id === id && document.locale === locale) ?? null
  );
}

/**
 * 12.1 — the same document in the default locale when the requested locale is
 * not published, so a reader is never handed a 404 for a document that exists.
 */
export function resolveLegalDocument(
  id: LegalDocumentId,
  locale: LegalLocale = DEFAULT_LEGAL_LOCALE,
): LegalDocumentDefinition | null {
  return findLegalDocument(id, locale) ?? findLegalDocument(id, DEFAULT_LEGAL_LOCALE);
}

/**
 * 12.1 — `"privacy-policy@1.0.0"`. What 12.4 persists: one opaque string, so a
 * consent row cannot drift into a document/version pair that never existed.
 */
export function legalConsentKey(
  id: LegalDocumentId,
  version: LegalDocumentVersionString,
): LegalConsentKey {
  return `${id}@${version}`;
}

const VERSION_PATTERN = /^(\d+)\.(\d+)\.(\d+)$/;

/** 12.1 — `"1.0.0"` to its parts, or `null` if it is not a version at all. */
export function parseLegalVersion(
  version: LegalDocumentVersionString,
): LegalDocumentVersion | null {
  const match = VERSION_PATTERN.exec(version);

  if (match === null) {
    return null;
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

/**
 * 12.1 — the re-consent rule, in one place because 12.4 must not reimplement
 * it: **a major or minor bump goes stale, a patch does not.** A patch is
 * reserved for changes that cannot alter what a reader agreed to. Anything
 * touching a right, a purpose, a retention period or a recipient is at least a
 * minor bump, and every prior acceptance stops counting.
 *
 * An unparseable or absent acceptance is treated as stale rather than as an
 * error: not knowing what someone accepted is the same position as their
 * having accepted nothing, and the safe resolution is to ask again.
 */
export function requiresReconsent(
  acceptedVersion: LegalDocumentVersionString | null | undefined,
  currentVersion: LegalDocumentVersionString,
): boolean {
  if (acceptedVersion === null || acceptedVersion === undefined) {
    return true;
  }

  const accepted = parseLegalVersion(acceptedVersion);
  const current = parseLegalVersion(currentVersion);

  if (accepted === null || current === null) {
    return true;
  }

  return accepted.major !== current.major || accepted.minor !== current.minor;
}

export type { LegalDocumentDefinition } from './legal-document.types';
