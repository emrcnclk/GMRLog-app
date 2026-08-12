import type { AccentKey } from '@gmrlog/ui';

import {
  BANNER_STYLE_LABELS,
  CARD_STYLE_LABELS,
  type ProfileBannerStyle,
  type ProfileCardStyle,
} from './profile-customization-model';

export type CosmeticCategory = 'accent' | 'cardStyle' | 'bannerStyle';

export const COSMETIC_CATEGORIES: readonly CosmeticCategory[] = [
  'accent',
  'cardStyle',
  'bannerStyle',
];

export const COSMETIC_CATEGORY_LABELS: Record<CosmeticCategory, string> = {
  accent: 'Accents',
  cardStyle: 'Card styles',
  bannerStyle: 'Banners',
};

export type CosmeticItem =
  | { category: 'accent'; id: AccentKey; name: string }
  | { category: 'cardStyle'; id: ProfileCardStyle; name: string }
  | { category: 'bannerStyle'; id: ProfileBannerStyle; name: string };

/**
 * §19's grid needs a catalog, and the only real cosmetic data anywhere in the
 * schema is the free accent/card-style/banner options D3.27 and §6 already
 * ship — there is no purchasable-item table, no per-item ownership column,
 * no payment provider (`BACKEND_CHANGES.md` §8 — its own scoping pass, not a
 * one-line follow-up). Rather than invent SKUs and prices this app has no way
 * to sell, the catalog is these three real option sets, and every entry is
 * honestly `Owned`: no player has ever had to unlock any of them.
 *
 * Accent keys/labels come in as parameters rather than a direct `@gmrlog/ui`
 * import: that package's root barrel pulls in every React Native component it
 * ships, which this pure, unit-tested model file must not drag in just to
 * read two token constants. The screen (never unit-tested by rendering, same
 * standing as every other presentational piece in this codebase) passes the
 * real `ACCENT_KEYS`/`ACCENT_LABELS` through.
 */
export function buildCosmeticCatalog(
  accentKeys: readonly AccentKey[],
  accentLabels: Record<AccentKey, string>,
): CosmeticItem[] {
  return [
    ...accentKeys.map((id) => ({ category: 'accent' as const, id, name: accentLabels[id] })),
    ...(Object.keys(CARD_STYLE_LABELS) as ProfileCardStyle[]).map((id) => ({
      category: 'cardStyle' as const,
      id,
      name: CARD_STYLE_LABELS[id],
    })),
    ...(Object.keys(BANNER_STYLE_LABELS) as ProfileBannerStyle[]).map((id) => ({
      category: 'bannerStyle' as const,
      id,
      name: BANNER_STYLE_LABELS[id],
    })),
  ];
}

export function filterCatalogByCategory(
  catalog: readonly CosmeticItem[],
  category: CosmeticCategory,
): CosmeticItem[] {
  return catalog.filter((item) => item.category === category);
}
