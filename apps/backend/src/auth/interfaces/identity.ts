import type { IdentityClass, SessionState } from '@gmrlog/types';

/**
 * F6.7 §6–§7 — identity attached at the platform edge, before protected
 * meaning. Every request is treated independently; client UI state is never
 * proof of identity.
 */

/** Anonymous guest — no platform identity attached. */
export interface GuestIdentity {
  class: Extract<IdentityClass, 'guest'>;
}

/** Platform-confirmed player identity resolved from a verified access credential. */
export interface AuthenticatedIdentity {
  class: Extract<IdentityClass, 'player'>;
  userId: string;
  /** Present when the access credential carries a session binding (D3.18). */
  sessionId?: string;
}

/** Union attached to every request by the auth guards. */
export type RequestIdentity = GuestIdentity | AuthenticatedIdentity;

export const GUEST_IDENTITY: GuestIdentity = { class: 'guest' };

export function isAuthenticatedIdentity(
  identity: RequestIdentity,
): identity is AuthenticatedIdentity {
  return identity.class === 'player';
}

/** Maps an attached identity to the shared architectural session state. */
export function sessionStateForIdentity(identity: RequestIdentity): SessionState {
  return isAuthenticatedIdentity(identity) ? 'authenticated' : 'guest';
}

/** Key under which guards attach the resolved identity to the request object. */
export const REQUEST_IDENTITY_KEY = 'identity' as const;

/** Structural view of a request carrying an attached identity. */
export interface IdentityCarrier {
  [REQUEST_IDENTITY_KEY]?: RequestIdentity;
  headers?: Record<string, string | string[] | undefined>;
}
