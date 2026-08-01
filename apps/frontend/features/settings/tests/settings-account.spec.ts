import type { ConnectedAccountResponse } from '@gmrlog/types';
import { describe, expect, it } from 'vitest';

import {
  connectedAccountStatusLabel,
  providerLabel,
  resolveConnectedAccountsView,
} from '../model/account-model';

function account(partial: Partial<ConnectedAccountResponse> = {}): ConnectedAccountResponse {
  return {
    provider: 'steam',
    status: 'connected',
    linkedAt: '2026-01-01T00:00:00.000Z',
    scopes: ['identity'],
    ...partial,
  };
}

describe('settings account model', () => {
  it('resolves loading empty error ready', () => {
    expect(
      resolveConnectedAccountsView({
        isPending: true,
        isError: false,
        error: null,
        items: [],
      }).status,
    ).toBe('loading');
    expect(
      resolveConnectedAccountsView({
        isPending: false,
        isError: true,
        error: new Error('x'),
        items: [],
      }).status,
    ).toBe('error');
    expect(
      resolveConnectedAccountsView({
        isPending: false,
        isError: false,
        error: null,
        items: [],
      }).status,
    ).toBe('empty');
    expect(
      resolveConnectedAccountsView({
        isPending: false,
        isError: false,
        error: null,
        items: [account()],
      }).status,
    ).toBe('ready');
  });

  it('labels providers and statuses', () => {
    expect(providerLabel('steam')).toBe('Steam');
    expect(providerLabel('discord')).toBe('Discord');
    expect(connectedAccountStatusLabel('connected')).toBe('Connected');
    expect(connectedAccountStatusLabel('disconnected')).toBe('Disconnected');
    expect(connectedAccountStatusLabel('expired')).toBe('Expired');
  });
});
