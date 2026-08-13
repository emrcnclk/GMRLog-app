import type { OAuthProviderKind, SignInMethodsResponse } from '@gmrlog/types';

export type SignInMethodsStatus = 'loading' | 'error' | 'ready';

export interface SignInMethodsView {
  status: SignInMethodsStatus;
  methods: SignInMethodsResponse | null;
  error: unknown;
}

export function resolveSignInMethodsView(input: {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  methods: SignInMethodsResponse | null | undefined;
}): SignInMethodsView {
  if (input.isPending && !input.methods) {
    return { status: 'loading', methods: null, error: null };
  }
  if (input.isError && !input.methods) {
    return { status: 'error', methods: null, error: input.error };
  }
  return { status: 'ready', methods: input.methods ?? null, error: input.error };
}

export function providerDisplayLabel(provider: OAuthProviderKind): string {
  switch (provider) {
    case 'google':
      return 'Google';
    case 'discord':
      return 'Discord';
  }
}

/**
 * Task 4.7's guard, mirrored client-side for UI purposes only — the server
 * (`OAuthService.disconnectLogin`) is the actual enforcement. Used to
 * disable a Disconnect control in front of the same count the backend will
 * refuse behind, not to replace the guard.
 */
export function canDisconnect(
  methods: SignInMethodsResponse,
  provider: OAuthProviderKind,
): boolean {
  const connected = provider === 'google' ? methods.google.connected : methods.discord.connected;
  if (!connected) return false;
  return methods.usableCount > 1;
}
