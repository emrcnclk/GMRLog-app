import { FrontendApiError } from '../api/axios-client';

export type AuthUiErrorKind =
  | 'unauthorized'
  | 'forbidden'
  | 'offline'
  | 'timeout'
  | 'unavailable'
  | 'validation'
  | 'expired'
  | 'rate_limited'
  | 'unknown';

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
 * Codes for a provider (Google/Discord OAuth or Steam's own connect flow)
 * failing to respond — server message already names the provider
 * (OAUTH.md §4: "Google is not responding. Try again, or use email."), so
 * it's safe and useful to echo rather than replace.
 */
const PROVIDER_UNAVAILABLE_CODES = new Set([
  'OAUTH_PROVIDER_UNAVAILABLE',
  'STEAM_CONNECT_PROVIDER_UNAVAILABLE',
]);

/**
 * Maps transport / API failures to banner copy — never Alert dialogs.
 *
 * Task 4.6 — every branch here is keyed on HTTP status and, where one
 * exists, the server's `error.code`, never on the free-text `message`
 * alone for anything auth-sensitive. Password login's three failure modes
 * (wrong password, unknown email, an oauth-only/null-`secretHash` account)
 * all arrive as the same status and the same server message
 * (`SessionsService.login`) and are deliberately left to fall through to
 * the generic 401 branch below rather than earning a code-specific case —
 * giving one of them its own branch here would be exactly the "distinct
 * copy" account-enumeration oracle this task exists to avoid, even though
 * the code that would produce it lives in this file, not the backend's.
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
    const code = error.envelope?.error.code;

    // The rate limiter working as intended (CLAUDE.md) — reads as "wait",
    // not as "something broke". Every auth-class route shares this policy,
    // so there is nothing case-specific to say beyond that.
    if (error.status === 429) {
      return {
        kind: 'rate_limited',
        title: 'Slow down',
        description: 'Too many attempts. Wait a moment and try again.',
      };
    }

    // A one-time OAuth/Steam-connect state token missing, expired, or
    // already used. The store can't tell the caller which of those it was
    // (OAUTH.md §4) — that's the point, not a gap — so both codes collapse
    // to one "expired" message rather than a per-cause breakdown.
    if (code === 'OAUTH_STATE_INVALID') {
      return {
        kind: 'expired',
        title: 'Sign-in expired',
        description: 'That sign-in expired. Try again.',
      };
    }
    if (code === 'STEAM_CONNECT_STATE_INVALID') {
      return {
        kind: 'expired',
        title: 'Connection expired',
        description: 'That connection expired. Try again.',
      };
    }

    // Steam OpenID verification failed. Every distinct cause — forged
    // assertion, `is_valid:false`, a mismatched `return_to`, a malformed
    // `claimed_id` — is already one code server-side
    // (`SteamConnectController`), so none of Steam's protocol internals
    // ever have a chance to reach this file, let alone the screen.
    if (code === 'STEAM_CONNECT_VERIFICATION_FAILED') {
      return {
        kind: 'unauthorized',
        title: 'Could not verify Steam',
        description: 'Steam could not verify that sign-in. Try again.',
      };
    }

    // A SteamID already attached to a different GMRLOG account. Whoever can
    // trigger this has just proven that exact SteamID is theirs (OpenID) or
    // is at minimum the one asserting it (self-report) — there is no third
    // party being named, so "already connected" is safe to say outright.
    if (code === 'STEAM_CONNECT_ALREADY_LINKED') {
      return {
        kind: 'validation',
        title: 'Steam account already connected',
        description:
          'This Steam account is already connected to another player. Disconnect it there first.',
      };
    }

    // `OAuthService`'s `account_deleted` rejection — the matched user row
    // exists but is soft-deleted. Says nothing about which of the two
    // matching rules (rule 1, existing oauth credential, or rule 2, a
    // verified-email link) found it.
    if (code === 'OAUTH_ACCOUNT_UNAVAILABLE') {
      return {
        kind: 'unauthorized',
        title: 'Account unavailable',
        description: 'This account is no longer available.',
      };
    }

    // OAUTH.md §4's prescribed copy names the provider and the recovery
    // path explicitly ("Sign in with your password, then connect Google
    // from Settings."); safe to echo because the only way to reach this is
    // presenting an email that is already the caller's own.
    if (code === 'OAUTH_EMAIL_CONFLICT') {
      return {
        kind: 'validation',
        title: 'Email already registered',
        description:
          error.message ||
          'This email is already registered. Sign in with your password, then connect from Settings.',
      };
    }

    // Task 4.7's disconnect guard (OAUTH.md §5: "refuse to disconnect the
    // last remaining sign-in method"). The server's own message already
    // names the provider and the escape hatch — echo it rather than
    // replacing it with a generic one.
    if (code === 'LAST_SIGN_IN_METHOD') {
      return {
        kind: 'validation',
        title: 'This is your only sign-in method',
        description:
          error.message || 'Set a password or connect another provider first, then try again.',
      };
    }

    // A Settings "Connect" attempt (task 4.7) whose provider identity is
    // already an `AuthCredential` row on a *different* GMRLOG account. Same
    // reasoning as `STEAM_CONNECT_ALREADY_LINKED` above — completing the
    // provider's sign-in already proves ownership, so naming the conflict is
    // safe.
    if (code === 'OAUTH_IDENTITY_ALREADY_LINKED') {
      return {
        kind: 'validation',
        title: 'Already connected elsewhere',
        description: error.message || 'This account is already connected to another player.',
      };
    }

    if (code === 'PASSWORD_ALREADY_SET') {
      return {
        kind: 'validation',
        title: 'Password already set',
        description: error.message || 'A password is already set for this account.',
      };
    }

    if (code === 'EMAIL_REQUIRED') {
      return {
        kind: 'validation',
        title: 'Email required',
        description: error.message || 'An email is required to set a password.',
      };
    }

    if (code === 'EMAIL_ALREADY_REGISTERED') {
      return {
        kind: 'validation',
        title: 'Email already registered',
        description: error.message || 'Try a different email address.',
      };
    }

    if (code !== undefined && PROVIDER_UNAVAILABLE_CODES.has(code)) {
      return {
        kind: 'unavailable',
        title: 'Provider unavailable',
        description:
          error.message || 'That sign-in provider is not responding. Try again, or use email.',
      };
    }

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
