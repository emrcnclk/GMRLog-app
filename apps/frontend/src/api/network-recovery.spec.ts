import { describe, expect, it } from 'vitest';

import { FrontendApiError } from './axios-client';

describe('network recovery error mapping', () => {
  it('FrontendApiError carries offline-friendly zero status', () => {
    const error = new FrontendApiError('You are offline', 0, null, 'req_offline');
    expect(error.status).toBe(0);
    expect(error.message).toBe('You are offline');
    expect(error.requestId).toBe('req_offline');
  });
});
