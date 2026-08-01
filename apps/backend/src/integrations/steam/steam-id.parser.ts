/**
 * Pure Steam identity normalization (D3.23 / STEAM_IMPORT.md).
 * Accepts SteamID64, profile URL, or vanity URL → structured parse result.
 */

const STEAM_ID64_RE = /^7656119\d{10}$/;
const PROFILE_URL_RE =
  /^(?:https?:\/\/)?(?:www\.)?steamcommunity\.com\/profiles\/(7656119\d{10})\/?(?:\?.*)?$/i;
const VANITY_URL_RE =
  /^(?:https?:\/\/)?(?:www\.)?steamcommunity\.com\/id\/([A-Za-z0-9_-]+)\/?(?:\?.*)?$/i;
const VANITY_NAME_RE = /^[A-Za-z0-9_-]{2,64}$/;

export interface SteamId64Result {
  kind: 'steamId64';
  steamId64: string;
}

export interface SteamVanityResult {
  kind: 'vanity';
  vanity: string;
}

export type SteamIdentityParseResult = SteamId64Result | SteamVanityResult;

export class SteamIdParseError extends Error {
  readonly code = 'invalid_steam_identity';

  constructor(message = 'Unrecognized Steam identity') {
    super(message);
    this.name = 'SteamIdParseError';
  }
}

export function isSteamId64(value: string): boolean {
  return STEAM_ID64_RE.test(value.trim());
}

/**
 * Normalize raw connect input to SteamID64 or vanity handle.
 * Vanity still needs Steam Web API `ResolveVanityURL` to become SteamID64.
 */
export function parseSteamIdentity(raw: string): SteamIdentityParseResult {
  const input = raw.trim();
  if (input.length === 0) {
    throw new SteamIdParseError('Steam identity is empty');
  }

  if (isSteamId64(input)) {
    return { kind: 'steamId64', steamId64: input };
  }

  const profileMatch = PROFILE_URL_RE.exec(input);
  if (profileMatch?.[1] !== undefined) {
    return { kind: 'steamId64', steamId64: profileMatch[1] };
  }

  const vanityMatch = VANITY_URL_RE.exec(input);
  if (vanityMatch?.[1] !== undefined) {
    return { kind: 'vanity', vanity: vanityMatch[1] };
  }

  if (VANITY_NAME_RE.test(input) && !/^\d+$/.test(input)) {
    return { kind: 'vanity', vanity: input };
  }

  throw new SteamIdParseError('Unrecognized Steam identity');
}

/** Extract SteamID64 when the input already contains it; otherwise null. */
export function tryExtractSteamId64(raw: string): string | null {
  try {
    const parsed = parseSteamIdentity(raw);
    return parsed.kind === 'steamId64' ? parsed.steamId64 : null;
  } catch {
    return null;
  }
}

export function extractVanityName(raw: string): string | null {
  try {
    const parsed = parseSteamIdentity(raw);
    return parsed.kind === 'vanity' ? parsed.vanity : null;
  } catch {
    return null;
  }
}

export function profileUrlForSteamId64(steamId64: string): string {
  return `https://steamcommunity.com/profiles/${steamId64}`;
}

export function vanityUrlForHandle(vanity: string): string {
  return `https://steamcommunity.com/id/${vanity}`;
}
