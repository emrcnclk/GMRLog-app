import type {
  AuthCredentialRepository,
  UserConsentRepository,
  UserRepository,
  UserSettingsRepository,
} from '@gmrlog/database';

/**
 * The repositories a registration writes through, all bound to one
 * transaction.
 *
 * `SessionsService.register` creates a user, a password credential, a settings
 * row and two or three consent rows. Its own comment claimed a failure part-way
 * through "fails loudly rather than leaving an account with no evidence of
 * consent behind it" — which was not true of four independent calls. A
 * transient database error between the credential and the consent left a real
 * account with a usable password and no `UserConsent` row at all, and every
 * retry then hit `ConflictException` ("Handle is already in use"), so the
 * account could never finish registering and could never gain one. That is the
 * precise state Phase 12.4 exists to prevent.
 */
export interface RegistrationRepositories {
  users: UserRepository;
  credentials: AuthCredentialRepository;
  settings: UserSettingsRepository;
  consents: UserConsentRepository;
}

/**
 * Runs `fn` with every registration repository bound to a single transaction,
 * committing on return and rolling back on throw.
 *
 * A function rather than the repositories themselves because the transaction's
 * lifetime is the callback's: Prisma's interactive transaction ends when the
 * callback settles, so there is no way to hand out a long-lived
 * transaction-scoped repository. Injected as a token so a unit test can supply
 * one that simply calls `fn` with fakes — the seam the four injected
 * repositories already gave this service, kept.
 */
export type RegistrationTransaction = <T>(
  fn: (repositories: RegistrationRepositories) => Promise<T>,
) => Promise<T>;

export const REGISTRATION_TRANSACTION = Symbol('REGISTRATION_TRANSACTION');
