import type {
  ApiEnvelope,
  LegalDocumentId,
  LegalDocumentResponse,
  LegalDocumentSummaryResponse,
  LegalLocale,
} from '@gmrlog/types';

import { ApiClient } from './client.js';

/**
 * 12.2 — legal documents transport. Public routes: these calls carry no token
 * and must work for a visitor who has no account yet, which is the whole point
 * of the surface (a reader has to see the terms before agreeing to them).
 *
 * DTOs come from `@gmrlog/types`, never duplicated here.
 */
export class LegalClient {
  constructor(private readonly api: ApiClient) {}

  /**
   * `GET /legal` — every document's current version, without bodies.
   *
   * This is the call a client makes to notice a version bump: cheap enough to
   * run on launch, and 12.4 compares what it returns against the versions the
   * player accepted.
   */
  listDocuments(locale?: LegalLocale): Promise<ApiEnvelope<LegalDocumentSummaryResponse[]>> {
    return this.api.get<LegalDocumentSummaryResponse[]>('/legal', { locale });
  }

  /** `GET /legal/{document}` — one document, body included. Body is Markdown. */
  getDocument(
    document: LegalDocumentId,
    locale?: LegalLocale,
  ): Promise<ApiEnvelope<LegalDocumentResponse>> {
    return this.api.get<LegalDocumentResponse>(`/legal/${document}`, { locale });
  }
}

export function createLegalClient(api: ApiClient): LegalClient {
  return new LegalClient(api);
}
