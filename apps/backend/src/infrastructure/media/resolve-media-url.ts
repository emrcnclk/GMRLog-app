/**
 * Storage key → public CDN URL (S1 §13.14 / §15 media fields).
 * Reads `MEDIA_PUBLIC_BASE_URL` at call time so boot-validated env stays the SSOT.
 */

export const DEFAULT_MEDIA_PUBLIC_BASE_URL = 'https://cdn.gmrlog.local/';

/**
 * Hosts whose image URLs are stored and served as references, not copied into
 * our storage — the catalog's media model since 2026-09, chosen so that
 * mirroring ~229k games does not mean downloading and hosting ~35 GB of art
 * (docs/18_CATALOG/METADATA_LICENSING.md §5).
 *
 * An allowlist, not "any https URL": a media reference is written by our own
 * providers, and anything else found in a key column is treated as a storage
 * key, which fails closed rather than pointing a player's browser at an
 * arbitrary host. RAWG is listed although it is disabled, so enabling it
 * later does not silently break every image it supplies.
 */
const PROVIDER_IMAGE_HOSTS = [
  'images.igdb.com',
  'steamstatic.com',
  'steamcdn-a.akamaihd.net',
  'media.rawg.io',
] as const;

/** True when `ref` is a provider image URL to serve as-is. */
export function isProviderMediaUrl(ref: string): boolean {
  if (!ref.startsWith('https://')) {
    return false;
  }
  try {
    const host = new URL(ref).hostname;
    return PROVIDER_IMAGE_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
  } catch {
    return false;
  }
}

export function resolveMediaUrl(key: string | null): string | null {
  if (key == null || key.length === 0) {
    return null;
  }
  if (isProviderMediaUrl(key)) {
    return key;
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
  // A referenced IGDB image has no variants of ours — IGDB serves every size
  // itself, so they come from swapping the size token instead.
  const derived = variants === null && storageKey !== null ? igdbVariants(storageKey) : null;
  if (derived !== null) {
    return {
      url: derived.standard,
      thumbUrl: derived.thumb,
      heroUrl: derived.hero,
      blurHash,
      width,
      height,
    };
  }

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

/**
 * IGDB's image URL — `https://images.igdb.com/igdb/image/upload/<size>/<id>.jpg`
 * — with the size token captured. Our providers store a reference at the size
 * `IMAGE_SIZE_BY_KIND` picks for its kind (`igdb.provider.ts`), so the stored
 * token says what the image is and therefore which sizes stand in for our
 * thumb / standard / hero variants (200 / 800 / 1920 px wide).
 */
const IGDB_IMAGE = /^(https:\/\/images\.igdb\.com\/igdb\/image\/upload\/)(t_[a-z0-9_]+)(\/[^/]+)$/;

const IGDB_VARIANTS_BY_STORED_SIZE: Readonly<Record<string, ResponsiveImageVariants>> = {
  // covers: 90 / 264 / 528 px wide
  t_cover_big: { thumb: 't_cover_small', standard: 't_cover_big', hero: 't_cover_big_2x' },
  // banners and artworks: 569 / 889 / 1920
  t_1080p: { thumb: 't_screenshot_med', standard: 't_screenshot_big', hero: 't_1080p' },
  // screenshots: 569 / 889 / 1280
  t_screenshot_huge: {
    thumb: 't_screenshot_med',
    standard: 't_screenshot_big',
    hero: 't_screenshot_huge',
  },
};

function igdbVariants(ref: string): ResponsiveImageVariants | null {
  const match = IGDB_IMAGE.exec(ref);
  if (match === null) {
    return null;
  }
  const [, prefix, size, rest] = match;
  const sizes = size === undefined ? undefined : IGDB_VARIANTS_BY_STORED_SIZE[size];
  if (prefix === undefined || rest === undefined || sizes === undefined) {
    return null;
  }
  return {
    thumb: `${prefix}${sizes.thumb}${rest}`,
    standard: `${prefix}${sizes.standard}${rest}`,
    hero: `${prefix}${sizes.hero}${rest}`,
  };
}
