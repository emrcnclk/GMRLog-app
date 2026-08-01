import { describe, expect, it } from 'vitest';

import {
  extractVanityName,
  profileUrlForSteamId64,
  tryExtractSteamId64,
  vanityUrlForHandle,
} from './steam-id.parser';

describe('steam-id.parser helpers', () => {
  it('tryExtractSteamId64 returns id or null', () => {
    expect(tryExtractSteamId64('76561198000000000')).toBe('76561198000000000');
    expect(tryExtractSteamId64('https://steamcommunity.com/id/gaben')).toBeNull();
    expect(tryExtractSteamId64('')).toBeNull();
  });

  it('extractVanityName returns vanity or null', () => {
    expect(extractVanityName('https://steamcommunity.com/id/gaben')).toBe('gaben');
    expect(extractVanityName('76561198000000000')).toBeNull();
  });

  it('builds profile and vanity urls', () => {
    expect(profileUrlForSteamId64('76561198000000000')).toContain('/profiles/');
    expect(vanityUrlForHandle('gaben')).toContain('/id/gaben');
  });
});
