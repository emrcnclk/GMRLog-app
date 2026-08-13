import type { User } from '@gmrlog/database';
import type { OAuthProviderKind } from '@gmrlog/types';

/**
 * Verified callback data from an OAuth code exchange (OAUTH.md §2 step 4).
 * The client never supplies this directly — it is what the backend gets
 * back after exchanging the provider's code server-side.
 */
export interface OAuthIdentity {
  provider: OAuthProviderKind;
  /** Stable provider user id (OIDC `sub`, Discord user id). */
  subject: string;
  /**
   * `null` when the provider didn't return one (Discord edge case, OAUTH.md
   * §4) — the caller runs the same email-capture step Steam uses before
   * retrying with an email attached. Out of scope for this service.
   */
  email: string | null;
  /** Whether the provider vouches for `email`. Ignored when `email` is `null`. */
  emailVerified: boolean;
  /** Provider display name — seeds a deduplicated handle for new users. */
  displayName: string;
}

export type OAuthRejectionReason = 'unverified_email_conflict' | 'account_deleted';

/** Outcome of `OAuthService.resolveLogin` — OAUTH.md §3 rules 1-4. */
export type OAuthMatchResult =
  | { outcome: 'signed_in'; user: User }
  | { outcome: 'linked'; user: User }
  | { outcome: 'created'; user: User }
  | { outcome: 'rejected'; reason: 'unverified_email_conflict'; hasPassword: boolean }
  | { outcome: 'rejected'; reason: 'account_deleted' };
