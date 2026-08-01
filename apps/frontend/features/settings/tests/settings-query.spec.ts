import type { SettingsResponse } from '@gmrlog/types';
import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { queryKeys } from '../../../src/query/query-client';
import { defaultSettings } from '../model/settings-model';

describe('settings query architecture', () => {
  let client: QueryClient;

  beforeEach(() => {
    client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it('uses canonical settings key', () => {
    expect(queryKeys.settings).toEqual(['settings']);
  });

  it('optimistically patches theme then rolls back', () => {
    const previous = defaultSettings();
    client.setQueryData(queryKeys.settings, previous);
    client.setQueryData(queryKeys.settings, {
      ...previous,
      appearance: { ...previous.appearance, theme: 'dark' },
    } satisfies SettingsResponse);
    expect(client.getQueryData<SettingsResponse>(queryKeys.settings)?.appearance.theme).toBe(
      'dark',
    );
    client.setQueryData(queryKeys.settings, previous);
    expect(client.getQueryData<SettingsResponse>(queryKeys.settings)?.appearance.theme).toBe(
      'system',
    );
  });

  it('optimistically patches reduceMotion', () => {
    const previous = defaultSettings();
    client.setQueryData(queryKeys.settings, previous);
    client.setQueryData(queryKeys.settings, {
      ...previous,
      accessibility: { reduceMotion: true },
    });
    expect(
      client.getQueryData<SettingsResponse>(queryKeys.settings)?.accessibility.reduceMotion,
    ).toBe(true);
  });

  it('invalidates only settings after appearance patch', async () => {
    const spy = vi.spyOn(client, 'invalidateQueries');
    await client.invalidateQueries({ queryKey: queryKeys.settings });
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.settings });
    expect(spy).not.toHaveBeenCalledWith({ queryKey: queryKeys.me });
  });

  it('connected accounts key nests under settings', () => {
    expect([...queryKeys.settings, 'connected-accounts']).toEqual([
      'settings',
      'connected-accounts',
    ]);
  });
});
