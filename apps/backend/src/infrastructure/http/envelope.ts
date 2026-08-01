import type { ApiEnvelope } from '@gmrlog/types';

import { isPaginatedPayload } from './paginated-payload';

/** S1 §4.1 success envelope. */
export function buildEnvelope<T>(data: T, requestId: string): ApiEnvelope<T> {
  return { data, meta: { requestId } };
}

/** S1 §4.2 list envelope with cursor pagination meta. */
export function buildPaginatedEnvelope<T>(
  items: readonly T[],
  requestId: string,
  cursor: { next: string | null; prev?: string | null },
  hasMore: boolean,
  limit: number,
): ApiEnvelope<T[]> {
  return {
    data: [...items],
    meta: {
      requestId,
      cursor,
      hasMore,
      limit,
    },
  };
}

export function buildEnvelopeFromValue(value: unknown, requestId: string): unknown {
  if (isPaginatedPayload(value)) {
    return buildPaginatedEnvelope(value.items, requestId, value.cursor, value.hasMore, value.limit);
  }
  return buildEnvelope(value, requestId);
}
