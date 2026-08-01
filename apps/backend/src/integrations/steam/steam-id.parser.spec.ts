import { describe, expect, it } from 'vitest';

import {
  extractVanityName,
  isSteamId64,
  parseSteamIdentity,
  profileUrlForSteamId64,
  SteamIdParseError,
  tryExtractSteamId64,
  vanityUrlForHandle,
} from './steam-id.parser';

describe('isSteamId64', () => {
  it('accepts a valid 17-digit SteamID64', () => {
    expect(isSteamId64('76561198000000001')).toBe(true);
  });

  it('rejects truncated or non-Steam prefixes', () => {
    expect(isSteamId64('7656119800000000')).toBe(false);
    expect(isSteamId64('12345678901234567')).toBe(false);
  });
});

describe('parseSteamIdentity', () => {
  it('parses bare SteamID64', () => {
    expect(parseSteamIdentity('76561198000000001')).toEqual({
      kind: 'steamId64',
      steamId64: '76561198000000001',
    });
  });

  it('parses profile URL with https and trailing slash', () => {
    expect(parseSteamIdentity('https://steamcommunity.com/profiles/76561198000000001/')).toEqual({
      kind: 'steamId64',
      steamId64: '76561198000000001',
    });
  });

  it('parses profile URL without scheme', () => {
    expect(parseSteamIdentity('steamcommunity.com/profiles/76561198000000001')).toEqual({
      kind: 'steamId64',
      steamId64: '76561198000000001',
    });
  });

  it('parses vanity URL', () => {
    expect(parseSteamIdentity('https://steamcommunity.com/id/gmrlog_tester')).toEqual({
      kind: 'vanity',
      vanity: 'gmrlog_tester',
    });
  });

  it('parses bare vanity handle', () => {
    expect(parseSteamIdentity('gmrlog_tester')).toEqual({
      kind: 'vanity',
      vanity: 'gmrlog_tester',
    });
  });

  it('trims whitespace around SteamID64', () => {
    expect(parseSteamIdentity('  76561198000000001  ')).toEqual({
      kind: 'steamId64',
      steamId64: '76561198000000001',
    });
  });

  it('throws on empty input', () => {
    expect(() => parseSteamIdentity('   ')).toThrow(SteamIdParseError);
  });

  it('parses www profile URL with query string', () => {
    expect(
      parseSteamIdentity('https://www.steamcommunity.com/profiles/76561198000000001?utm=1'),
    ).toEqual({ kind: 'steamId64', steamId64: '76561198000000001' });
  });

  it('rejects pure numeric non-SteamID64 vanity lookalikes', () => {
    expect(() => parseSteamIdentity('12345')).toThrow(SteamIdParseError);
  });

  it('throws on unrecognized garbage', () => {
    expect(() => parseSteamIdentity('not a steam id!!!')).toThrow(SteamIdParseError);
  });
});

describe('helpers', () => {
  it('tryExtractSteamId64 returns id or null', () => {
    expect(tryExtractSteamId64('76561198000000001')).toBe('76561198000000001');
    expect(tryExtractSteamId64('https://steamcommunity.com/id/foo')).toBeNull();
    expect(tryExtractSteamId64('???')).toBeNull();
  });

  it('extractVanityName returns vanity or null', () => {
    expect(extractVanityName('https://steamcommunity.com/id/foo')).toBe('foo');
    expect(extractVanityName('76561198000000001')).toBeNull();
  });

  it('builds profile and vanity URLs', () => {
    expect(profileUrlForSteamId64('76561198000000001')).toBe(
      'https://steamcommunity.com/profiles/76561198000000001',
    );
    expect(vanityUrlForHandle('gmrlog')).toBe('https://steamcommunity.com/id/gmrlog');
  });
});
