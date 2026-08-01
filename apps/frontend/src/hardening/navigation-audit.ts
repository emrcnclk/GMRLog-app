/**
 * D3.16 navigation & deep-link audit contracts — documentation as code.
 * Expo Router file-based linking; no invented path rewrites.
 */

export const AUTH_PROTECTED_ROOT_SEGMENTS = ['(app)', '(settings)', '(modals)'] as const;

export const AUTH_GUEST_ROOT_SEGMENTS = ['(auth)'] as const;

export const TAB_ROUTES = [
  '/(app)/(tabs)/home',
  '/(app)/(tabs)/discover',
  '/(app)/(tabs)/search',
  '/(app)/(tabs)/notifications',
  '/(app)/(tabs)/profile',
] as const;

export const DEEP_LINK_SCHEME = 'gmrlog';

export const DEEP_LINK_HOSTS = ['gmrlog.com', 'www.gmrlog.com'] as const;

/** Known intentional stubs — not dead routes; documented for QA. */
export const KNOWN_STUB_ROUTES = ['/(modals)', '/(app)/user/[id]', '+not-found'] as const;

/**
 * Map an inbound URL to the Expo root segment family used by AuthGate.
 * Does not invent product paths — only scheme/host recognition for smoke tests.
 */
export function resolveDeepLinkFamily(url: string): {
  scheme: string | null;
  host: string | null;
  isAppScheme: boolean;
  isUniversalLink: boolean;
} {
  try {
    const parsed = new URL(url);
    const scheme = parsed.protocol.replace(':', '');
    const host = parsed.hostname.length > 0 ? parsed.hostname : null;
    const isAppScheme = scheme === DEEP_LINK_SCHEME;
    const isUniversalLink =
      (scheme === 'https' || scheme === 'http') &&
      host !== null &&
      (DEEP_LINK_HOSTS as readonly string[]).includes(host);
    return { scheme, host, isAppScheme, isUniversalLink };
  } catch {
    return { scheme: null, host: null, isAppScheme: false, isUniversalLink: false };
  }
}

export function isProtectedRootSegment(segment: string | undefined): boolean {
  return (
    segment !== undefined && (AUTH_PROTECTED_ROOT_SEGMENTS as readonly string[]).includes(segment)
  );
}
