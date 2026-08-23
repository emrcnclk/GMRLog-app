import type { UserConsentRepository } from '@gmrlog/database';
import type {
  LegalConsentDecisionValue,
  LegalConsentRecordResponse,
  LegalConsentStateResponse,
  LegalDocumentId,
  LegalDocumentSummaryResponse,
  LegalLocale,
} from '@gmrlog/types';
import type {
  LegalAcknowledgementRecordInput,
  LegalConsentDecisionInput,
  LegalDocumentRefInput,
} from '@gmrlog/validators';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import {
  ACCEPTANCE_REQUIRED_DOCUMENT_IDS,
  DEFAULT_LEGAL_LOCALE,
  DISCLOSURE_DOCUMENT_IDS,
  decisionForDisplayedDocument,
  legalConsentKey,
  requiresReconsent,
  resolveLegalDocument,
} from './documents';
import { LEGAL_CONSENT_REPOSITORY } from './legal.tokens';

interface StoredConsent {
  documentId: string;
  version: string;
  locale: string;
  decision: LegalConsentDecisionValue;
  decidedAt: Date;
}

/**
 * 12.4 — what a player was shown, and what they decided about it.
 *
 * The app rendered "By continuing you agree to the Terms and Privacy Policy" on
 * both auth screens for months and kept no evidence that anyone had. Under KVKK
 * and the GDPR alike, proving consent is the controller's burden.
 */
@Injectable()
export class LegalConsentService {
  // No `LegalService` dependency, deliberately. It would only supply document
  // summaries that `resolveLegalDocument` already returns, and taking it would
  // force this service into the same module as the public document controller —
  // which imports `AuthModule` for its guard, while `AuthModule` needs *this*
  // service for the register flow. Keeping the dependency out is what keeps the
  // module graph acyclic without a `forwardRef`.
  constructor(
    @Inject(LEGAL_CONSENT_REPOSITORY)
    private readonly consents: UserConsentRepository,
  ) {}

  /**
   * Validates what a registration submitted against what is actually current.
   *
   * Rejects rather than silently correcting. A player who left the sign-up
   * screen open across a deploy read a document that is no longer current;
   * quietly recording that as agreement to the new version would put a false
   * statement in the very record that exists to be evidence.
   *
   * 12.4a — the submission now lists what was *displayed*. Every document must
   * be present and current, whether it is a contract or a notice: a privacy
   * notice that was not shown has not been given, and the disclosure obligation
   * is not discharged by having a copy on a server somewhere.
   */
  assertShownDocumentsAreCurrent(shown: readonly LegalDocumentRefInput[]): void {
    const byDocument = new Map<string, LegalDocumentRefInput>();

    for (const entry of shown) {
      if (byDocument.has(entry.documentId)) {
        throw new BadRequestException(`Duplicate entry for ${entry.documentId}`);
      }
      byDocument.set(entry.documentId, entry);
    }

    const required = [...ACCEPTANCE_REQUIRED_DOCUMENT_IDS, ...DISCLOSURE_DOCUMENT_IDS];

    for (const id of required) {
      const entry = byDocument.get(id);

      if (entry === undefined) {
        throw new BadRequestException(
          ACCEPTANCE_REQUIRED_DOCUMENT_IDS.includes(id)
            ? `Acceptance of ${id} is required`
            : `${id} must be shown before an account is created`,
        );
      }

      const current = resolveLegalDocument(id, entry.locale);

      if (current === null) {
        throw new BadRequestException(`Unknown legal document: ${id}`);
      }

      if (current.version !== entry.version) {
        // The client is a version behind. Better a failed registration the
        // player can retry against the current text than an account whose
        // record says something untrue.
        throw new BadRequestException(
          `${id} has moved to ${current.version}; re-read the current version`,
        );
      }
    }

    for (const entry of byDocument.values()) {
      if (resolveLegalDocument(entry.documentId, entry.locale) === null) {
        throw new BadRequestException(`Unknown legal document: ${entry.documentId}`);
      }
    }
  }

  /**
   * Records what a registration displayed.
   *
   * **The verdict is derived here, not sent by the client.** The Terms are
   * `accepted` — the schema's `termsAccepted: literal(true)` guarantees the box
   * was ticked before this runs — and every notice is `acknowledged`. A client
   * cannot mislabel a privacy notice as consent because it never gets to say
   * what a display means.
   */
  async recordRegistrationConsent(
    userId: string,
    shown: readonly LegalDocumentRefInput[],
  ): Promise<void> {
    await this.consents.recordMany(
      shown.map((entry) => ({
        userId,
        documentId: entry.documentId,
        version: entry.version,
        locale: entry.locale,
        consentKey: legalConsentKey(entry.documentId, entry.version),
        decision: decisionForDisplayedDocument(entry.documentId),
      })),
    );
  }

  /** Records decisions taken after registration — re-consent, refusal, withdrawal. */
  async recordDecisions(
    userId: string,
    decisions: readonly LegalConsentDecisionInput[],
  ): Promise<LegalConsentStateResponse> {
    for (const decision of decisions) {
      const document = resolveLegalDocument(decision.documentId, decision.locale);

      if (document === null) {
        throw new BadRequestException(`Unknown legal document: ${decision.documentId}`);
      }

      if (!document.requiresAcceptance) {
        throw new BadRequestException(`${decision.documentId} is not a document to accept`);
      }

      if (document.version !== decision.version) {
        throw new BadRequestException(
          `${decision.documentId} has moved to ${document.version}; decide against the current version`,
        );
      }
    }

    await this.consents.recordMany(
      decisions.map((decision) => ({
        userId,
        documentId: decision.documentId,
        version: decision.version,
        locale: decision.locale,
        consentKey: legalConsentKey(decision.documentId, decision.version),
        decision: decision.decision,
      })),
    );

    return this.getState(userId);
  }

  /**
   * Records that notices, not contracts, were displayed after an account
   * already exists.
   *
   * 12.4b closes a gap 12.4a left open: `recordRegistrationConsent` writes an
   * `acknowledged` row for every notice a *registration* shows, but nothing
   * wrote one for a notice shown afterwards — an OAuth sign-up seeing the
   * Privacy Policy for the first time, or any account whose notices moved to a
   * new version. Refuses an acceptance-required document with the same message
   * `recordDecisions` uses for the inverse case, so the two error strings stay
   * paired rather than drifting into two ways of saying the same rule.
   */
  async acknowledgeDisclosures(
    userId: string,
    documents: readonly LegalAcknowledgementRecordInput['documents'][number][],
  ): Promise<LegalConsentStateResponse> {
    for (const entry of documents) {
      const document = resolveLegalDocument(entry.documentId, entry.locale);

      if (document === null) {
        throw new BadRequestException(`Unknown legal document: ${entry.documentId}`);
      }

      if (document.requiresAcceptance) {
        throw new BadRequestException(`${entry.documentId} is not a document to accept`);
      }

      if (document.version !== entry.version) {
        throw new BadRequestException(
          `${entry.documentId} has moved to ${document.version}; show the current version`,
        );
      }
    }

    await this.consents.recordMany(
      documents.map((entry) => ({
        userId,
        documentId: entry.documentId,
        version: entry.version,
        locale: entry.locale,
        consentKey: legalConsentKey(entry.documentId, entry.version),
        decision: decisionForDisplayedDocument(entry.documentId),
      })),
    );

    return this.getState(userId);
  }

  /**
   * Where a player stands.
   *
   * Four separate answers, because they call for four different actions.
   *
   * `outstanding` holds documents requiring acceptance whose current version
   * carries **no decision at all** — ask about these. A declined or withdrawn
   * version is not outstanding: it was asked and answered, which is what stops
   * the app re-prompting a refusal on every launch (F2.27 §7).
   *
   * `undisclosed` (12.4a) holds notices whose current version has not been
   * shown. The remedy is to *display* it, not to ask about it — putting a
   * privacy notice in `outstanding` would imply asking for something it is not
   * lawful to ask for.
   *
   * `blocked` (12.4b) holds documents requiring acceptance where the player
   * **was** asked and answered something other than `accepted`. This is the
   * piece `outstanding` cannot carry without reopening the nagging problem it
   * exists to close: "don't repeat the same prompt" and "let them use the
   * product anyway" are different questions, and a caller building a consent
   * gate needs the second answer to show the *consequence* of a no once,
   * rather than either silently admitting or silently re-asking.
   *
   * `satisfied` is the separate question of whether every document requiring
   * acceptance is accepted. A caller asking "may this player proceed" reads
   * that; one asking "what do I show" reads the other three.
   */
  async getState(
    userId: string,
    locale: LegalLocale = DEFAULT_LEGAL_LOCALE,
  ): Promise<LegalConsentStateResponse> {
    const stored = (await this.consents.listByUser(userId)) as StoredConsent[];

    const decisions: LegalConsentRecordResponse[] = stored.map((row) => ({
      documentId: row.documentId as LegalDocumentId,
      version: row.version,
      locale: row.locale as LegalLocale,
      decision: row.decision,
      decidedAt: row.decidedAt.toISOString(),
    }));

    const summarise = (
      document: NonNullable<ReturnType<typeof resolveLegalDocument>>,
    ): LegalDocumentSummaryResponse => ({
      id: document.id,
      locale: document.locale,
      version: document.version,
      effectiveDate: document.effectiveDate,
      title: document.title,
      requiresAcceptance: document.requiresAcceptance,
    });

    const recordFor = (id: LegalDocumentId, version: string) =>
      decisions.find((row) => row.documentId === id && row.version === version);

    const outstanding: LegalDocumentSummaryResponse[] = [];
    const blocked: LegalDocumentSummaryResponse[] = [];
    let satisfied = true;

    for (const id of ACCEPTANCE_REQUIRED_DOCUMENT_IDS) {
      const current = resolveLegalDocument(id, locale);

      if (current === null) {
        continue;
      }

      let decision = recordFor(id, current.version);

      if (decision === undefined) {
        // No decision at the current version. Before treating that as
        // outstanding, check whether an older version's decision still
        // covers it — requiresReconsent's whole point is that a patch bump
        // must not re-prompt someone who already answered.
        const priorDecision = decisions
          .filter((row) => row.documentId === id)
          .sort((a, b) => (a.decidedAt < b.decidedAt ? 1 : -1))[0];

        if (
          priorDecision !== undefined &&
          !requiresReconsent(priorDecision.version, current.version)
        ) {
          decision = priorDecision;
        } else {
          // Never asked at this version, and any prior decision is stale —
          // an OAuth sign-up, an account older than this table, or a major/
          // minor bump since the last acceptance.
          outstanding.push(summarise(current));
          satisfied = false;
          continue;
        }
      }

      if (decision.decision !== 'accepted') {
        // Asked, and answered something other than yes. Not outstanding —
        // asking again would be exactly the nag F2.27 §7 forbids — but not
        // satisfied either, and a caller needs to know which of the two.
        blocked.push(summarise(current));
        satisfied = false;
      }
    }

    const undisclosed: LegalDocumentSummaryResponse[] = [];

    for (const id of DISCLOSURE_DOCUMENT_IDS) {
      const current = resolveLegalDocument(id, locale);

      if (current === null) {
        continue;
      }

      // Any record of this version counts as shown. There is no "wrong" answer
      // to a notice — the obligation is discharged by display, not by a verdict.
      if (recordFor(id, current.version) === undefined) {
        undisclosed.push(summarise(current));
      }
    }

    return {
      decisions,
      outstanding,
      undisclosed,
      blocked,
      satisfied,
    };
  }
}
