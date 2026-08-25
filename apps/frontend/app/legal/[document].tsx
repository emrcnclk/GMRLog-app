import { useLocalSearchParams } from 'expo-router';

import { parseLegalDocumentId } from '../../features/legal/model/legal-model';
import { LegalDocumentScreen } from '../../features/legal/screens/legal-document-screen';

/**
 * 12.3 — the legal reader, mounted at the root rather than inside `(auth)` or
 * `(settings)`.
 *
 * `resolveAuthGate` only redirects out of `(auth)` and the `(app)` family, so a
 * `legal` root segment resolves to `allow` for a guest and for an authenticated
 * player alike. One screen serves both the sign-in legal line and Settings ›
 * About; neither needs its own copy.
 */
export default function LegalDocumentRoute() {
  const params = useLocalSearchParams<{ document?: string | string[] }>();

  return <LegalDocumentScreen document={parseLegalDocumentId(params.document)} />;
}
