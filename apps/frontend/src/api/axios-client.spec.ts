import { describe, expect, it } from 'vitest';

import { createIdempotencyKey } from './idempotency';
import { FrontendApiError } from './axios-client';

describe('createIdempotencyKey', () => {
  it('returns a unique opaque key', () => {
    const a = createIdempotencyKey('post');
    const b = createIdempotencyKey('post');
    expect(a).toMatch(/^post_/);
    expect(a).not.toBe(b);
  });
});

describe('FrontendApiError', () => {
  it('carries status and request id', () => {
    const error = new FrontendApiError('boom', 409, null, 'req_1');
    expect(error.status).toBe(409);
    expect(error.requestId).toBe('req_1');
    expect(error.name).toBe('FrontendApiError');
  });
});
