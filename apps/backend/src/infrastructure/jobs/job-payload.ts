import { randomUUID } from 'node:crypto';

/** BullMQ job envelope — docs/06_BACKEND/BACKGROUND_JOBS.md § Job Payload Standard */
export interface JobPayload<T = unknown> {
  schemaVersion: 1;
  correlationId: string;
  causationId?: string;
  idempotencyKey: string;
  enqueuedAt: string;
  data: T;
}

export function createJobPayload<T>(
  data: T,
  options: { correlationId?: string; causationId?: string; idempotencyKey: string },
): JobPayload<T> {
  return {
    schemaVersion: 1,
    correlationId: options.correlationId ?? randomUUID(),
    ...(options.causationId !== undefined ? { causationId: options.causationId } : {}),
    idempotencyKey: options.idempotencyKey,
    enqueuedAt: new Date().toISOString(),
    data,
  };
}
