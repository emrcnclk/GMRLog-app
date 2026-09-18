import { afterEach, describe, expect, it, vi } from 'vitest';

import { isProviderMediaUrl, resolveMediaUrl, toResponsiveImage } from './resolve-media-url';

const IGDB = 'https://images.igdb.com/igdb/image/upload';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('resolveMediaUrl', () => {
  it('builds a public URL from a storage key, as before', () => {
    vi.stubEnv('MEDIA_PUBLIC_BASE_URL', 'https://api.example.com/media/');

    expect(resolveMediaUrl('games/g1/cover/abc-standard.webp')).toBe(
      'https://api.example.com/media/games%2Fg1%2Fcover%2Fabc-standard.webp',
    );
  });

  // The catalog's media model since 2026-09: provider images are referenced,
  // not copied, so a stored provider URL is served exactly as it is.
  it('passes a provider image URL through untouched', () => {
    vi.stubEnv('MEDIA_PUBLIC_BASE_URL', 'https://api.example.com/media/');
    const cover = `${IGDB}/t_cover_big/co1abc.jpg`;

    expect(resolveMediaUrl(cover)).toBe(cover);
    expect(
      resolveMediaUrl(
        'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1/header.jpg',
      ),
    ).toContain('steamstatic.com');
  });

  // An allowlist fails closed: a URL on any other host is treated as a
  // storage key, never handed to a player's browser as a link to follow.
  it('does not pass through a URL on a host that is not a known provider', () => {
    vi.stubEnv('MEDIA_PUBLIC_BASE_URL', 'https://api.example.com/media/');

    const resolved = resolveMediaUrl('https://evil.example/tracker.gif');

    expect(resolved?.startsWith('https://api.example.com/media/')).toBe(true);
  });

  it('answers null for an empty reference', () => {
    expect(resolveMediaUrl(null)).toBeNull();
    expect(resolveMediaUrl('')).toBeNull();
  });
});

describe('isProviderMediaUrl', () => {
  it('accepts the providers and their subdomains, over https only', () => {
    expect(isProviderMediaUrl(`${IGDB}/t_1080p/ar1.jpg`)).toBe(true);
    expect(isProviderMediaUrl('https://cdn.akamai.steamstatic.com/x.jpg')).toBe(true);
    expect(isProviderMediaUrl('http://images.igdb.com/x.jpg')).toBe(false);
  });

  // `endsWith(".host")`, not `includes(host)`: a lookalike domain must not ride
  // on a provider's name.
  it('rejects a lookalike host', () => {
    expect(isProviderMediaUrl('https://images.igdb.com.evil.example/x.jpg')).toBe(false);
    expect(isProviderMediaUrl('https://notsteamstatic.com/x.jpg')).toBe(false);
  });
});

describe('toResponsiveImage with an IGDB reference', () => {
  it('derives cover sizes from the stored cover token', () => {
    const image = toResponsiveImage(`${IGDB}/t_cover_big/co1abc.jpg`, null, null, null, null);

    expect(image).toEqual({
      url: `${IGDB}/t_cover_big/co1abc.jpg`,
      thumbUrl: `${IGDB}/t_cover_small/co1abc.jpg`,
      heroUrl: `${IGDB}/t_cover_big_2x/co1abc.jpg`,
      blurHash: null,
      width: null,
      height: null,
    });
  });

  it('derives banner sizes from the stored 1080p token', () => {
    const image = toResponsiveImage(`${IGDB}/t_1080p/ar9z.jpg`, null, null, null, null);

    expect(image?.thumbUrl).toBe(`${IGDB}/t_screenshot_med/ar9z.jpg`);
    expect(image?.url).toBe(`${IGDB}/t_screenshot_big/ar9z.jpg`);
    expect(image?.heroUrl).toBe(`${IGDB}/t_1080p/ar9z.jpg`);
  });

  it('keeps a downloaded asset on its own stored variants', () => {
    vi.stubEnv('MEDIA_PUBLIC_BASE_URL', 'https://api.example.com/media/');

    const image = toResponsiveImage(
      'games/g1/cover/k-standard.webp',
      'LHFYS',
      {
        thumb: 'games/g1/cover/k-thumb.webp',
        standard: 'games/g1/cover/k-standard.webp',
        hero: 'games/g1/cover/k-hero.webp',
      },
      264,
      374,
    );

    expect(image?.url).toContain('api.example.com/media/');
    expect(image?.blurHash).toBe('LHFYS');
  });

  // A size token this map does not know still serves the image as-is rather
  // than dropping it.
  it('falls back to the single stored URL for an unmapped IGDB size', () => {
    const ref = `${IGDB}/t_thumb/co1abc.jpg`;

    expect(toResponsiveImage(ref, null, null, null, null)).toMatchObject({
      url: ref,
      thumbUrl: null,
      heroUrl: null,
    });
  });
});
