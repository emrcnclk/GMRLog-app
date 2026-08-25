import type {
  LegalDocumentId,
  LegalDocumentResponse,
  LegalDocumentSummaryResponse,
  LegalLocale,
} from '@gmrlog/types';
import { Injectable, NotFoundException } from '@nestjs/common';

import {
  DEFAULT_LEGAL_LOCALE,
  LEGAL_DOCUMENTS,
  type LegalDocumentDefinition,
  resolveLegalDocument,
} from './documents';

function toSummary(document: LegalDocumentDefinition): LegalDocumentSummaryResponse {
  return {
    id: document.id,
    locale: document.locale,
    version: document.version,
    effectiveDate: document.effectiveDate,
    title: document.title,
    requiresAcceptance: document.requiresAcceptance,
  };
}

function toResponse(document: LegalDocumentDefinition): LegalDocumentResponse {
  return { ...toSummary(document), body: document.body };
}

/**
 * 12.2 — reads from the 12.1 registry. Deliberately holds no repository, no
 * cache and no I/O: the documents are compiled into the bundle, so a legal
 * route cannot fail because a database, Redis or an object store is down.
 *
 * That is not incidental. The sign-in screen has to be able to show a reader
 * what they are agreeing to *before* they have an account, and CLAUDE.md's own
 * environment notes record Redis dropping silently four sessions running. A
 * Terms page that 503s with the rest of the stack would be worse than the
 * plain-text sentence 12.3 replaces.
 */
@Injectable()
export class LegalService {
  /**
   * Every document's metadata in one locale, without any bodies — so a client
   * can detect a version bump (and 12.4 can raise re-consent) with one small
   * request rather than fetching three full texts.
   */
  listDocuments(locale: LegalLocale = DEFAULT_LEGAL_LOCALE): LegalDocumentSummaryResponse[] {
    const seen = new Set<LegalDocumentId>();
    const summaries: LegalDocumentSummaryResponse[] = [];

    for (const document of LEGAL_DOCUMENTS) {
      if (seen.has(document.id)) {
        continue;
      }

      // Resolve rather than filter on locale, so a document published in only
      // one locale still appears in every listing instead of disappearing from
      // the drift check entirely.
      const resolved = resolveLegalDocument(document.id, locale);

      if (resolved !== null) {
        seen.add(document.id);
        summaries.push(toSummary(resolved));
      }
    }

    return summaries;
  }

  /** One document, falling back to the default locale before giving up. */
  getDocument(
    id: LegalDocumentId,
    locale: LegalLocale = DEFAULT_LEGAL_LOCALE,
  ): LegalDocumentResponse {
    const document = resolveLegalDocument(id, locale);

    if (document === null) {
      // Unreachable through the route — the param schema enumerates the ids —
      // but a registry entry could be removed without the enum following, and
      // an empty 200 would be the worst possible answer for a legal document.
      throw new NotFoundException(`Unknown legal document: ${id}`);
    }

    return toResponse(document);
  }
}
