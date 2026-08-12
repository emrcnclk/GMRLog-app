import {
  ACCENT_KEYS,
  ACCENT_LABELS,
  GradientScrim,
  HatchOverlay,
  NavHeader,
  SegmentedTabs,
  Text,
  createThemeTokens,
  useTheme,
} from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  buildCosmeticCatalog,
  COSMETIC_CATEGORIES,
  COSMETIC_CATEGORY_LABELS,
  filterCatalogByCategory,
  type CosmeticCategory,
  type CosmeticItem,
} from '../hooks/cosmetics-store-model';

/**
 * §19 — Cosmetics store. `3b.6`'s footer link finally has somewhere real to
 * go, and `3b.7`'s own scope question — the ownership/entitlement model
 * `BACKEND_CHANGES.md` §8 flags as missing — is decided here: there isn't
 * one, and this screen doesn't invent one.
 *
 * §19 describes a grid of purchasable items with prices, an owned/not-owned
 * split, and a featured item with a Reserve button. None of that has data
 * behind it anywhere: `ProfileCardStyle`/`ProfileBannerStyle` carry no
 * ownership concept (3b.6's own finding), there is no cosmetic-item catalog
 * table, and there is no payment provider of any kind (§8 — "its own scoping
 * pass, not a one-line follow-up"). Rather than fabricate SKUs and prices to
 * fill the grid, the catalog is the one real cosmetic surface that exists —
 * the free accent/card-style/banner options §6 and §18 already ship — and
 * every item honestly renders `Owned`, because every player already has all
 * of them. The featured item and its Reserve button are omitted rather than
 * built against invented content: unlike 3b.5's Subscription CTA (a real
 * plan, a real price, only the purchase action disabled), there is no real
 * item here to feature in the first place.
 */
export function CosmeticsStoreScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const catalog = useMemo(() => buildCosmeticCatalog(ACCENT_KEYS, ACCENT_LABELS), []);
  const [category, setCategory] = useState<CosmeticCategory>('accent');

  const items = filterCatalogByCategory(catalog, category);

  return (
    <View style={{ flex: 1, backgroundColor: theme.color('color.background.primary') }}>
      <NavHeader
        title="Store"
        topInset={insets.top}
        onBack={() => {
          router.back();
        }}
        backLabel="Back to Customize"
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.space('space.5'),
          paddingTop: theme.space('space.4'),
          paddingBottom: insets.bottom + theme.space('space.4'),
          gap: theme.space('space.5'),
        }}
      >
        <Text role="body" color="color.text.tertiary">
          Cosmetic only. Nothing here changes your stats, ranking, or what other players can see of
          your record.
        </Text>

        <SegmentedTabs
          items={COSMETIC_CATEGORIES.map((id) => ({ id, label: COSMETIC_CATEGORY_LABELS[id] }))}
          activeId={category}
          onChange={setCategory}
          variant="pill"
          accessibilityLabel="Cosmetic category"
        />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space('space.3') }}>
          {items.map((item) => (
            <CosmeticTile key={`${item.category}:${item.id}`} item={item} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

/** Not a `Pressable` — §19's "Owned items ... are not tappable" is literal. */
function CosmeticTile({ item }: { item: CosmeticItem }) {
  const theme = useTheme();

  return (
    <View
      style={{
        flexBasis: '47%',
        flexGrow: 1,
        gap: theme.space('space.2'),
        padding: theme.space('space.3'),
        borderRadius: theme.radius('radius.md'),
        borderWidth: 1,
        borderColor: theme.color('color.border.default'),
      }}
    >
      <CosmeticPreview item={item} />
      <Text role="label" color="color.text.primary" numberOfLines={1}>
        {item.name}
      </Text>
      <Text role="meta" color="color.text.tertiary">
        Owned
      </Text>
    </View>
  );
}

function CosmeticPreview({ item }: { item: CosmeticItem }) {
  const theme = useTheme();
  const previewStyle = {
    height: theme.space('space.16'),
    borderRadius: theme.radius('radius.sm'),
    overflow: 'hidden' as const,
  };

  if (item.category === 'accent') {
    const accentColor = createThemeTokens(theme.scheme, item.id).color['color.accent.default'];
    return <View style={[previewStyle, { backgroundColor: accentColor }]} />;
  }

  if (item.category === 'cardStyle') {
    const cardStyle = item.id;
    const tileStyle = (() => {
      switch (cardStyle) {
        case 'elevated':
          return {
            backgroundColor: theme.color('color.background.elevated'),
            borderWidth: 1,
            borderColor: theme.color('color.border.default'),
          };
        case 'flat':
          return { backgroundColor: theme.color('color.surface.secondary'), borderWidth: 0 };
        case 'outlined':
          return {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: theme.color('color.border.default'),
          };
        default: {
          const _exhaustive: never = cardStyle;
          return _exhaustive;
        }
      }
    })();
    return <View style={[previewStyle, tileStyle]} />;
  }

  const bannerStyle = item.id;
  return (
    <View
      style={[
        previewStyle,
        {
          backgroundColor:
            bannerStyle === 'solid'
              ? theme.color('color.accent.muted')
              : theme.color('color.background.secondary'),
        },
      ]}
    >
      {bannerStyle === 'artwork' ? <HatchOverlay /> : null}
      {bannerStyle === 'gradient' ? <GradientScrim direction="to-top" intensity={0.5} /> : null}
    </View>
  );
}
