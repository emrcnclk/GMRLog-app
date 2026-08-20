import type {
  LegalDocumentId,
  LegalDocumentResponse,
  LegalDocumentVersionString,
  LegalLocale,
} from '@gmrlog/types';

/**
 * 12.1 — one legal document, in one locale, at one version.
 *
 * The texts live as TypeScript modules rather than Markdown files on disk for
 * a build reason, not a stylistic one: the backend builds with a plain
 * `tsc -p tsconfig.build.json`, which does not copy non-TypeScript files into
 * `dist`, and there is no asset-copy step and no non-`.ts` file anywhere under
 * `apps/backend/src` to follow as precedent. A Markdown file would compile
 * away to nothing and the route would 404 in the Docker image while working
 * locally — exactly the class of silent drift 8.3d exists to catch. As a
 * module the text ships wherever the code ships: dev, vitest, and the runtime
 * image alike.
 *
 * `body` is Markdown, rendered by 12.3's reader screen.
 */
export interface LegalDocumentDefinition extends LegalDocumentResponse {
  id: LegalDocumentId;
  locale: LegalLocale;
  version: LegalDocumentVersionString;
  /** ISO `YYYY-MM-DD`. The day this version starts to apply. */
  effectiveDate: string;
  title: string;
  /**
   * Whether accepting this document is part of creating an account. The
   * Aydınlatma Metni is a disclosure, not a bargain — KVKK requires that it be
   * *given*, and treats explicit consent as a separate act — so it is served
   * and shown but never presented as something to agree to.
   */
  requiresAcceptance: boolean;
  body: string;
}
