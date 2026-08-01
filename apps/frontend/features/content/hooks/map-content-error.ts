import { FrontendApiError } from '../../../src/api/axios-client';
import { mapAuthError, type AuthUiError } from '../../../src/auth/map-auth-error';

/**
 * Maps create/edit/delete failures for content composers.
 * Reuses auth banner shapes · adds conflict copy for duplicate reviews.
 */
export function mapContentError(error: unknown, isOnline: boolean): AuthUiError {
  if (error instanceof FrontendApiError && error.status === 409) {
    return {
      kind: 'validation',
      title: 'Already exists',
      description:
        error.message ||
        'You already have content for this target. Edit the existing item instead.',
    };
  }
  return mapAuthError(error, isOnline);
}
