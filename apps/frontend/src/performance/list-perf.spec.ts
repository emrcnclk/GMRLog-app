import { describe, expect, it } from 'vitest';

import { fixedRowLayout, LIST_PERF, LIST_PERF_COMPACT } from './list-perf';

describe('list performance helpers', () => {
  it('exposes beneficial FlatList defaults', () => {
    expect(LIST_PERF.windowSize).toBeGreaterThan(0);
    expect(LIST_PERF.maxToRenderPerBatch).toBeGreaterThan(0);
    expect(LIST_PERF.removeClippedSubviews).toBe(true);
  });

  it('compact preset is smaller than default', () => {
    expect(LIST_PERF_COMPACT.windowSize).toBeLessThanOrEqual(LIST_PERF.windowSize);
    expect(LIST_PERF_COMPACT.initialNumToRender).toBeLessThanOrEqual(LIST_PERF.initialNumToRender);
  });

  it('fixedRowLayout computes offsets', () => {
    const layout = fixedRowLayout(64);
    expect(layout(null, 0)).toEqual({ length: 64, offset: 0, index: 0 });
    expect(layout(null, 2)).toEqual({ length: 64, offset: 128, index: 2 });
  });
});
