import { FrontendApiError } from '../api/axios-client';

export type AuthUiErrorKind =
  'unauthorized' | 'forbidden' | 'offline' | 'timeout' | 'unavailable' | 'validation' | 'unknown';

export interface AuthUiError {
  kind: AuthUiErrorKind;
  title: string;
  description: string;
}

function isTimeoutError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const code =
    'code' in error && typeof (error as { code?: unknown }).code === 'string'
      ? (error as { code: string }).code
      : '';
  return code === 'ECONNABORTED' || code === 'ETIMEDOUT' || /timeout/i.test(error.message);
}

/**
 * Maps transport / API failures to banner copy — never Alert dialogs.
 */
export function mapAuthError(error: unknown, isOnline: boolean): AuthUiError {
  if (!isOnline) {
    return {
      kind: 'offline',
      title: 'You are offline',
      description: 'Check your connection and try again.',
    };
  }

  if (isTimeoutError(error)) {
    return {
      kind: 'timeout',
      title: 'Request timed out',
      description: 'The server took too long to respond. Try again.',
    };
  }

  if (error instanceof FrontendApiError) {
    if (error.status === 401) {
      return {
        kind: 'unauthorized',
        title: 'Sign-in failed',
        description: error.message || 'Email or password is incorrect.',
      };
    }
    if (error.status === 403) {
      return {
        kind: 'forbidden',
        title: 'Access denied',
        description: error.message || 'You do not have permission to continue.',
      };
    }
    if (error.status === 409) {
      return {
        kind: 'validation',
        title: 'Account already exists',
        description: error.message || 'Try signing in or use a different email or handle.',
      };
    }
    if (error.status === 422 || error.envelope?.error.category === 'validation') {
      return {
        kind: 'validation',
        title: 'Check your details',
        description: error.message || 'Some fields need attention.',
      };
    }
    if (
      error.status === 0 ||
      error.status === 502 ||
      error.status === 503 ||
      error.status === 504
    ) {
      return {
        kind: 'unavailable',
        title: 'Server unavailable',
        description: 'GMRLOG could not be reached. Try again in a moment.',
      };
    }
    return {
      kind: 'unknown',
      title: 'Something went wrong',
      description: error.message || 'Please try again.',
    };
  }

  if (error instanceof Error && /network/i.test(error.message)) {
    return {
      kind: 'unavailable',
      title: 'Server unavailable',
      description: 'GMRLOG could not be reached. Try again in a moment.',
    };
  }

  return {
    kind: 'unknown',
    title: 'Something went wrong',
    description: error instanceof Error ? error.message : 'Please try again.',
  };
}
