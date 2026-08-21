import type { UserConsentRepository } from '@gmrlog/database';
import type {
  LegalConsentDecisionValue,
  LegalConsentRecordResponse,
  LegalConsentStateResponse,
  LegalDocumentId,
  LegalDocumentSummaryResponse,
  LegalLocale,
} from '@gmrlog/types';
import type { LegalAcceptanceInput, LegalConsentDecisionInput } from '@gmrlog/validators';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import {
  ACCEPTANCE_REQUIRED_DOCUMENT_IDS,
  DEFAULT_LEGAL_LOCALE,
  legalConsentKey,
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
   * screen open across a deploy accepted a document that is no longer current;
   * quietly recording that as consent to the new version would put a false
   * statement in the very record that exists to be evidence.
   */
  assertAcceptanceIsCurrent(accepted: readonly LegalAcceptanceInput[]): void {
    const byDocument = new Map<string, LegalAcceptanceInput>();

    for (const entry of accepted) {
      if (byDocument.has(entry.documentId)) {
        throw new BadRequestException(`Duplicate acceptance for ${entry.documentId}`);
      }
      byDocument.set(entry.documentId, entry);
    }

    for (const id of ACCEPTANCE_REQUIRED_DOCUMENT_IDS) {
      const entry = byDocument.get(id);

      if (entry === undefined) {
        throw new BadRequestException(`Acceptance of ${id} is required`);
      }

      const current = resolveLegalDocument(id, entry.locale);

      if (current === null) {
        throw new BadRequestException(`Unknown legal document: ${id}`);
      }

      if (current.version !== entry.version) {
        // The client is a version behind. Better a failed registration the
        // player can retry against the current text than an account whose
        // consent record says something untrue.
        throw new BadRequestException(
          `${id} has moved to ${current.version}; re-read and accept the current version`,
        );
      }
    }

    for (const entry of byDocument.values()) {
      const document = resolveLegalDocument(entry.documentId, entry.locale);

      if (!document?.requiresAcceptance) {
        // The Aydınlatma Metni is a disclosure, not a bargain (12.1). Accepting
        // it would manufacture a consent for processing that does not rest on
        // consent, so the route refuses rather than storing it.
        throw new BadRequestException(`${entry.documentId} is not a document to accept`);
      }
    }
  }

  /** Records a registration's acceptances. Called inside the register flow. */
  async recordRegistrationConsent(
    userId: string,
    accepted: readonly LegalAcceptanceInput[],
  ): Promise<void> {
    await this.consents.recordMany(
      accepted.map((entry) => ({
        userId,
        documentId: entry.documentId,
        version: entry.version,
        locale: entry.locale,
        consentKey: legalConsentKey(entry.documentId, entry.version),
        decision: 'accepted' as const,
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
   * Where a player stands.
   *
   * `outstanding` holds required documents whose current version carries **no
   * decision at all**. A declined or withdrawn version is not outstanding — it
   * was asked and answered — which is what stops the app re-prompting a refusal
   * on every launch (F2.27 §7: "no dark patterns that re-enable after refusal",
   * "silence is not consent"). `satisfied` is the separate question of whether
   * every required document is accepted; a caller that needs to know "may this
   * player proceed" reads that, and a caller that needs to know "what should I
   * ask about" reads `outstanding`.
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

    const outstanding: LegalDocumentSummaryResponse[] = [];
    let satisfied = true;

    for (const id of ACCEPTANCE_REQUIRED_DOCUMENT_IDS) {
      const current = resolveLegalDocument(id, locale);

      if (current === null) {
        continue;
      }

      const decision = decisions.find(
        (row) => row.documentId === id && row.version === current.version,
      );

      if (decision === undefined) {
        // Never asked at this version — an OAuth sign-up, an account older than
        // this table, or a version bump since the last acceptance.
        outstanding.push({
          id: current.id,
          locale: current.locale,
          version: current.version,
          effectiveDate: current.effectiveDate,
          title: current.title,
          requiresAcceptance: current.requiresAcceptance,
        });
        satisfied = false;
        continue;
      }

      if (decision.decision !== 'accepted') {
        satisfied = false;
      }
    }

    return {
      decisions,
      outstanding,
      satisfied,
    };
  }
}
