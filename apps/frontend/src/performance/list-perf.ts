/**
 * Shared FlatList performance defaults — apply only where beneficial (D3.14).
 */
export const LIST_PERF = {
  windowSize: 9,
  maxToRenderPerBatch: 12,
  initialNumToRender: 10,
  updateCellsBatchingPeriod: 50,
  removeClippedSubviews: true,
  onEndReachedThreshold: 0.4,
} as const;

export const LIST_PERF_COMPACT = {
  windowSize: 7,
  maxToRenderPerBatch: 8,
  initialNumToRender: 8,
  updateCellsBatchingPeriod: 50,
  removeClippedSubviews: true,
  onEndReachedThreshold: 0.4,
} as const;

/** Estimated row height helper for getItemLayout when rows are fixed. */
export function fixedRowLayout(rowHeight: number) {
  return (_data: unknown, index: number) => ({
    length: rowHeight,
    offset: rowHeight * index,
    index,
  });
}
