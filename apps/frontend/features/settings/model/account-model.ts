import type { ConnectedAccountResponse } from '@gmrlog/types';

export type ConnectedAccountsStatus = 'loading' | 'error' | 'empty' | 'ready';

export function resolveConnectedAccountsView(input: {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  items: ConnectedAccountResponse[];
}): {
  status: ConnectedAccountsStatus;
  items: ConnectedAccountResponse[];
  error: unknown;
} {
  if (input.isPending && input.items.length === 0) {
    return { status: 'loading', items: [], error: null };
  }
  if (input.isError && input.items.length === 0) {
    return { status: 'error', items: [], error: input.error };
  }
  if (input.items.length === 0) {
    return { status: 'empty', items: [], error: null };
  }
  return { status: 'ready', items: input.items, error: input.error };
}

export function connectedAccountStatusLabel(status: ConnectedAccountResponse['status']): string {
  switch (status) {
    case 'connected':
      return 'Connected';
    case 'disconnected':
      return 'Disconnected';
    case 'expired':
      return 'Expired';
  }
}

export function providerLabel(provider: ConnectedAccountResponse['provider']): string {
  switch (provider) {
    case 'steam':
      return 'Steam';
    case 'discord':
      return 'Discord';
  }
}
