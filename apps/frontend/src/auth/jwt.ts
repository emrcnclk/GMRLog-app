/**
 * Client-side JWT exp peek — not verification. Platform remains Trust authority.
 */

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }
  const segment = parts[1];
  if (!segment) {
    return null;
  }
  try {
    const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
    const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
    const json = globalThis.atob(normalized + pad);
    const parsed: unknown = JSON.parse(json);
    if (parsed === null || typeof parsed !== 'object') {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** True when `exp` is missing, unreadable, or within skew of now. */
export function isAccessTokenExpired(token: string, skewSeconds = 30): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload) {
    return true;
  }
  const exp = payload.exp;
  if (typeof exp !== 'number') {
    return true;
  }
  return exp * 1000 <= Date.now() + skewSeconds * 1000;
}
