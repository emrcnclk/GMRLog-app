import { describe, expect, it } from 'vitest';

import {
  DEFAULT_CUSTOMIZATION,
  DEFAULT_WIDGET_ORDER,
  moveWidget,
  normalizeWidgetOrder,
  parseCustomization,
  reorderWidget,
  resolveWidgetLayout,
  serializeCustomization,
  toggleInList,
  type ProfileCustomization,
  type ProfileWidgetId,
} from './profile-customization-model';

function customization(overrides: Partial<ProfileCustomization> = {}): ProfileCustomization {
  return {
    ...DEFAULT_CUSTOMIZATION,
    widgetOrder: [...DEFAULT_WIDGET_ORDER],
    ...overrides,
  };
}

describe('normalizeWidgetOrder', () => {
  it('appends widgets the stored order does not know about', () => {
    const order = normalizeWidgetOrder(['activity']);
    expect(order[0]).toBe('activity');
    expect(order).toHaveLength(DEFAULT_WIDGET_ORDER.length);
    expect(new Set(order).size).toBe(order.length);
  });

  it('drops unknown ids and de-duplicates', () => {
    const order = normalizeWidgetOrder(['activity', 'activity', 'nope', 42, null]);
    expect(order.filter((id) => id === 'activity')).toHaveLength(1);
    expect(order).toHaveLength(DEFAULT_WIDGET_ORDER.length);
  });

  it('falls back to the full default order for empty input', () => {
    expect(normalizeWidgetOrder([])).toEqual([...DEFAULT_WIDGET_ORDER]);
  });
});

describe('resolveWidgetLayout', () => {
  it('floats pinned widgets to the top preserving relative order', () => {
    const layout = resolveWidgetLayout(customization({ pinnedWidgets: ['activity', 'heatmap'] }));
    // 'heatmap' precedes 'activity' in the default order, so it stays first.
    expect(layout.slice(0, 2)).toEqual(['heatmap', 'activity']);
  });

  it('removes hidden widgets entirely', () => {
    const layout = resolveWidgetLayout(customization({ hiddenWidgets: ['insights'] }));
    expect(layout).not.toContain('insights');
  });

  it('lets hidden win over pinned for the same widget', () => {
    const layout = resolveWidgetLayout(
      customization({ pinnedWidgets: ['insights'], hiddenWidgets: ['insights'] }),
    );
    expect(layout).not.toContain('insights');
  });
});

describe('moveWidget', () => {
  const order: ProfileWidgetId[] = ['archetypes', 'insights', 'heatmap'];

  it('swaps with the neighbour in the given direction', () => {
    expect(moveWidget(order, 'insights', 'up')).toEqual(['insights', 'archetypes', 'heatmap']);
    expect(moveWidget(order, 'insights', 'down')).toEqual(['archetypes', 'heatmap', 'insights']);
  });

  it('is a no-op at either end', () => {
    expect(moveWidget(order, 'archetypes', 'up')).toEqual(order);
    expect(moveWidget(order, 'heatmap', 'down')).toEqual(order);
  });

  it('is a no-op for an id that is not present', () => {
    expect(moveWidget(order, 'wishlist', 'up')).toEqual(order);
  });
});

describe('reorderWidget', () => {
  const order: ProfileWidgetId[] = ['archetypes', 'insights', 'heatmap', 'activity'];

  it('moves a widget to an arbitrary index', () => {
    expect(reorderWidget(order, 'activity', 0)).toEqual([
      'activity',
      'archetypes',
      'insights',
      'heatmap',
    ]);
  });

  it('clamps out-of-range drop targets', () => {
    expect(reorderWidget(order, 'archetypes', 99)).toEqual([
      'insights',
      'heatmap',
      'activity',
      'archetypes',
    ]);
    expect(reorderWidget(order, 'activity', -5)[0]).toBe('activity');
  });

  it('never loses or duplicates a widget', () => {
    const result = reorderWidget(order, 'insights', 3);
    expect(new Set(result).size).toBe(order.length);
    expect(result).toHaveLength(order.length);
  });
});

describe('toggleInList', () => {
  it('adds then removes', () => {
    expect(toggleInList<ProfileWidgetId>([], 'heatmap')).toEqual(['heatmap']);
    expect(toggleInList<ProfileWidgetId>(['heatmap'], 'heatmap')).toEqual([]);
  });
});

describe('parseCustomization', () => {
  it('returns defaults for null, empty and malformed input', () => {
    expect(parseCustomization(null).accent).toBe('neutral');
    expect(parseCustomization('').accent).toBe('neutral');
    expect(parseCustomization('{not json').accent).toBe('neutral');
    expect(parseCustomization('"a string"').accent).toBe('neutral');
    expect(parseCustomization('null').accent).toBe('neutral');
  });

  it('always yields a complete widget order even from partial state', () => {
    const parsed = parseCustomization(JSON.stringify({ widgetOrder: ['activity'] }));
    expect(parsed.widgetOrder).toHaveLength(DEFAULT_WIDGET_ORDER.length);
  });

  it('rejects unknown enum values rather than storing them', () => {
    const parsed = parseCustomization(
      JSON.stringify({ cardStyle: 'holographic', bannerStyle: 'nope', consoleGeneration: 'gen99' }),
    );
    expect(parsed.cardStyle).toBe(DEFAULT_CUSTOMIZATION.cardStyle);
    expect(parsed.bannerStyle).toBe(DEFAULT_CUSTOMIZATION.bannerStyle);
    expect(parsed.consoleGeneration).toBeNull();
  });

  it('filters unknown widget ids out of pinned and hidden lists', () => {
    const parsed = parseCustomization(
      JSON.stringify({ pinnedWidgets: ['heatmap', 'bogus'], hiddenWidgets: ['bogus'] }),
    );
    expect(parsed.pinnedWidgets).toEqual(['heatmap']);
    expect(parsed.hiddenWidgets).toEqual([]);
  });

  it('round-trips through serialize', () => {
    const input = customization({
      accent: 'plasma',
      cardStyle: 'flat',
      bannerStyle: 'gradient',
      favoritePlatform: 'PC',
      consoleGeneration: 'gen9',
      pinnedWidgets: ['achievements'],
      hiddenWidgets: ['backlog'],
    });
    expect(parseCustomization(serializeCustomization(input))).toEqual(input);
  });
});
