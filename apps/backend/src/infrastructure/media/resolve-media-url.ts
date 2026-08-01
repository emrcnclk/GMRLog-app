/**
 * Storage key → public CDN URL (S1 §13.14 / §15 media fields).
 * Reads `MEDIA_PUBLIC_BASE_URL` at call time so boot-validated env stays the SSOT.
 */

export const DEFAULT_MEDIA_PUBLIC_BASE_URL = 'https://cdn.gmrlog.local/';

export function resolveMediaUrl(key: string | null): string | null {
  if (key == null || key.length === 0) {
    return null;
  }
  const configured = process.env.MEDIA_PUBLIC_BASE_URL?.trim();
  const base =
    configured !== undefined && configured.length > 0 ? configured : DEFAULT_MEDIA_PUBLIC_BASE_URL;
  const normalized = base.endsWith('/') ? base : `${base}/`;
  return `${normalized}${encodeURIComponent(key)}`;
}

export interface ResponsiveImageVariants {
  thumb: string;
  standard: string;
  hero: string;
}

export interface ResolvedResponsiveImage {
  url: string;
  thumbUrl: string | null;
  heroUrl: string | null;
  blurHash: string | null;
  width: number | null;
  height: number | null;
}

/**
 * `storageKey` → responsive DTO (D3.26). Returns null when the canonical key
 * itself is unset. Variant/blurHash absence (pre-D3.26 media) degrades to a
 * single-URL image rather than hiding the picture entirely.
 */
export function toResponsiveImage(
  storageKey: string | null,
  blurHash: string | null,
  variants: ResponsiveImageVariants | null,
  width: number | null,
  height: number | null,
): ResolvedResponsiveImage | null {
  const url = resolveMediaUrl(variants?.standard ?? storageKey);
  if (url == null) {
    return null;
  }
  return {
    url,
    thumbUrl: resolveMediaUrl(variants?.thumb ?? null),
    heroUrl: resolveMediaUrl(variants?.hero ?? null),
    blurHash,
    width,
    height,
  };
}
