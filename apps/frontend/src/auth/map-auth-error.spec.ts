import { describe, expect, it } from 'vitest';

import { FrontendApiError } from '../api/axios-client';
import { mapAuthError } from './map-auth-error';

/** Builds the exact envelope shape `AppExceptionFilter` sends for a given code. */
function envelopeFor(status: number, code: string, message: string) {
  return {
    error: {
      category: 'authn' as const,
      code,
      message,
      requestId: 'r1',
      retryable: false,
    },
  };
}

describe('mapAuthError', () => {
  it('maps offline before status', () => {
    const result = mapAuthError(new Error('anything'), false);
    expect(result.kind).toBe('offline');
  });

  it('maps 401', () => {
    const result = mapAuthError(new FrontendApiError('bad creds', 401, null, 'r1'), true);
    expect(result.kind).toBe('unauthorized');
  });

  it('maps 403', () => {
    const result = mapAuthError(new FrontendApiError('denied', 403, null, 'r1'), true);
    expect(result.kind).toBe('forbidden');
  });

  it('maps timeout', () => {
    const error = Object.assign(new Error('timeout of 30000ms exceeded'), {
      code: 'ECONNABORTED',
    });
    expect(mapAuthError(error, true).kind).toBe('timeout');
  });

  it('maps unavailable for status 0', () => {
    expect(mapAuthError(new FrontendApiError('network', 0, null, 'r1'), true).kind).toBe(
      'unavailable',
    );
  });

  describe('task 4.6 — password login must not enumerate accounts', () => {
    // `SessionsService.login` (apps/backend/src/auth/sessions.service.ts)
    // throws the identical `UnauthorizedException('Invalid email or
    // password')` — same status, same message, no `code` — for all three of
    // these. A frontend that gave any one of them its own copy would be the
    // enumeration oracle even though the backend never distinguished them.
    const wrongPassword = new FrontendApiError('Invalid email or password', 401, null, 'r1');
    const unknownEmail = new FrontendApiError('Invalid email or password', 401, null, 'r2');
    const oauthOnlyAccount = new FrontendApiError('Invalid email or password', 401, null, 'r3');

    it('gives wrong password, unknown email, and an oauth-only account byte-identical banner copy', () => {
      const results = [wrongPassword, unknownEmail, oauthOnlyAccount].map((error) =>
        mapAuthError(error, true),
      );

      expect(results[0]).toEqual(results[1]);
      expect(results[1]).toEqual(results[2]);
      expect(results[0]).toEqual({
        kind: 'unauthorized',
        title: 'Sign-in failed',
        description: 'Invalid email or password',
      });
    });
  });

  describe('task 4.6 — per-case OAuth / Steam connect copy', () => {
    it('collapses a replayed, unknown, or expired OAuth state to one message', () => {
      const replayed = new FrontendApiError(
        'That sign-in expired. Try again.',
        401,
        envelopeFor(401, 'OAUTH_STATE_INVALID', 'That sign-in expired. Try again.'),
        'r1',
      );
      const neverIssued = new FrontendApiError(
        'That sign-in expired. Try again.',
        401,
        envelopeFor(401, 'OAUTH_STATE_INVALID', 'That sign-in expired. Try again.'),
        'r2',
      );

      const result = mapAuthError(replayed, true);
      expect(result).toEqual({
        kind: 'expired',
        title: 'Sign-in expired',
        description: 'That sign-in expired. Try again.',
      });
      expect(mapAuthError(neverIssued, true)).toEqual(result);
    });

    it('collapses an expired Steam connect state to one message, distinct from the OAuth one', () => {
      const error = new FrontendApiError(
        'That connection expired. Try again.',
        401,
        envelopeFor(401, 'STEAM_CONNECT_STATE_INVALID', 'That connection expired. Try again.'),
        'r1',
      );
      expect(mapAuthError(error, true)).toEqual({
        kind: 'expired',
        title: 'Connection expired',
        description: 'That connection expired. Try again.',
      });
    });

    it('collapses every Steam OpenID verification failure to one message, whatever the underlying cause', () => {
      // Forged assertion vs. a mismatched return_to are different failures
      // inside `SteamOpenIdProvider.verifyAssertion`, but both surface as the
      // same code — the UI must not be able to tell them apart either.
      const forged = new FrontendApiError(
        'Steam could not verify that sign-in. Try again.',
        401,
        envelopeFor(
          401,
          'STEAM_CONNECT_VERIFICATION_FAILED',
          'Steam could not verify that sign-in. Try again.',
        ),
        'r1',
      );
      const returnToMismatch = new FrontendApiError(
        'Steam could not verify that sign-in. Try again.',
        401,
        envelopeFor(
          401,
          'STEAM_CONNECT_VERIFICATION_FAILED',
          'Steam could not verify that sign-in. Try again.',
        ),
        'r2',
      );

      const result = mapAuthError(forged, true);
      expect(result).toEqual({
        kind: 'unauthorized',
        title: 'Could not verify Steam',
        description: 'Steam could not verify that sign-in. Try again.',
      });
      expect(mapAuthError(returnToMismatch, true)).toEqual(result);
    });

    it('names a SteamID already linked to another player without naming who', () => {
      const error = new FrontendApiError(
        'Steam account already linked to another user',
        409,
        envelopeFor(
          409,
          'STEAM_CONNECT_ALREADY_LINKED',
          'Steam account already linked to another user',
        ),
        'r1',
      );
      const result = mapAuthError(error, true);
      expect(result.kind).toBe('validation');
      expect(result.description).not.toMatch(/@|user-\w+|player_/);
      expect(result).toEqual({
        kind: 'validation',
        title: 'Steam account already connected',
        description:
          'This Steam account is already connected to another player. Disconnect it there first.',
      });
    });

    it('maps a soft-deleted account match to a generic unavailable-account message', () => {
      const error = new FrontendApiError(
        'This account is no longer available.',
        401,
        envelopeFor(401, 'OAUTH_ACCOUNT_UNAVAILABLE', 'This account is no longer available.'),
        'r1',
      );
      expect(mapAuthError(error, true)).toEqual({
        kind: 'unauthorized',
        title: 'Account unavailable',
        description: 'This account is no longer available.',
      });
    });

    it('echoes the provider-named recovery copy for an unverified-email conflict', () => {
      const message =
        'This email is already registered. Sign in with your password, then connect Google from Settings.';
      const error = new FrontendApiError(
        message,
        409,
        envelopeFor(409, 'OAUTH_EMAIL_CONFLICT', message),
        'r1',
      );
      const result = mapAuthError(error, true);
      expect(result.kind).toBe('validation');
      expect(result.description).toBe(message);
    });

    it.each(['OAUTH_PROVIDER_UNAVAILABLE', 'STEAM_CONNECT_PROVIDER_UNAVAILABLE'])(
      'maps %s to an unavailable-provider message',
      (code) => {
        const error = new FrontendApiError(
          'Google is not responding. Try again, or use email.',
          503,
          envelopeFor(503, code, 'Google is not responding. Try again, or use email.'),
          'r1',
        );
        expect(mapAuthError(error, true).kind).toBe('unavailable');
      },
    );

    it('reads a 429 as "wait", not as a failure', () => {
      const error = new FrontendApiError(
        'Rate limit exceeded',
        429,
        envelopeFor(429, 'RATE_LIMITED', 'Rate limit exceeded'),
        'r1',
      );
      const result = mapAuthError(error, true);
      expect(result.kind).toBe('rate_limited');
      expect(result.title.toLowerCase()).not.toMatch(/wrong|error|broke|fail/);
      expect(result.description.toLowerCase()).toMatch(/wait|moment|slow/);
    });
  });
});
