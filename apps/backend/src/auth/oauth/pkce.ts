import { createHash, randomBytes } from 'node:crypto';

const VERIFIER_BYTES = 32;
const STATE_BYTES = 32;

/** RFC 7636 PKCE code verifier — a fresh one per `/start` attempt, never reused. */
export function generateCodeVerifier(): string {
  return randomBytes(VERIFIER_BYTES).toString('base64url');
}

/** RFC 7636 §4.2 S256 challenge derived from `verifier`. */
export function codeChallengeFromVerifier(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}

/** Unguessable, single-use `state` — the CSRF/replay anchor OAUTH.md §2-§4 requires. */
export function generateState(): string {
  return randomBytes(STATE_BYTES).toString('base64url');
}
