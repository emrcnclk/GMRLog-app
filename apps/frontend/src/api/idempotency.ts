/** Opaque Idempotency-Key for S1 §11 create intents. */
export function createIdempotencyKey(prefix = 'idem'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
