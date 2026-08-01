/**
 * Marker for S1 §4.2 / §5 list responses. EnvelopeInterceptor unwraps this into
 * `data` + cursor meta without inventing a second envelope dialect.
 */
export class PaginatedPayload<T> {
  constructor(
    readonly items: readonly T[],
    readonly cursor: { next: string | null; prev?: string | null },
    readonly hasMore: boolean,
    readonly limit: number,
  ) {}
}

export function isPaginatedPayload(value: unknown): value is PaginatedPayload<unknown> {
  return value instanceof PaginatedPayload;
}
