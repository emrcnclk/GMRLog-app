import type { AuthCredential } from '@gmrlog/database';

/**
 * Whether one `AuthCredential` row is a *usable* sign-in method — the same
 * distinction `SessionsService.login` already draws for password rows (a
 * `type=password` credential with `secretHash: null` is the OAuth-signup
 * email-claim placeholder, `OAuthService`'s doc comment on
 * `matchWithinTransaction` rule 4 — never a login method) so the two can't
 * drift apart. `type=oauth` rows are only ever planted for google/discord
 * (`OAuthService`, `OAuthProvider` enum) — Steam never creates one, so no
 * Steam-specific exclusion is needed here.
 */
export function isUsableSignInMethod(
  credential: Pick<AuthCredential, 'type' | 'secretHash'>,
): boolean {
  if (credential.type === 'password') {
    return credential.secretHash !== null;
  }
  return true;
}

/** Count of usable sign-in methods — what the last-method disconnect guard checks against. */
export function countUsableSignInMethods(
  credentials: readonly Pick<AuthCredential, 'type' | 'secretHash'>[],
): number {
  return credentials.filter(isUsableSignInMethod).length;
}
