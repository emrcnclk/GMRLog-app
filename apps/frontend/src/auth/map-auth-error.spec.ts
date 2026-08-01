import { describe, expect, it } from 'vitest';

import { FrontendApiError } from '../api/axios-client';
import { mapAuthError } from './map-auth-error';

describe('mapAuthError', () => {
  it('maps offline before status', () => {
    const result = mapAuthError(new Error('anything'), false);
    expect(result.kind).toBe('offline');
  });

  it('maps 401', () => {
    const result = mapAuthError(new FrontendApiError('bad creds', 401, null, 'r1'), true);
    expect(result.kind).toBe('unauthorized');
  });

  it('maps 403', () => {
    const result = mapAuthError(new FrontendApiError('denied', 403, null, 'r1'), true);
    expect(result.kind).toBe('forbidden');
  });

  it('maps timeout', () => {
    const error = Object.assign(new Error('timeout of 30000ms exceeded'), {
      code: 'ECONNABORTED',
    });
    expect(mapAuthError(error, true).kind).toBe('timeout');
  });

  it('maps unavailable for status 0', () => {
    expect(mapAuthError(new FrontendApiError('network', 0, null, 'r1'), true).kind).toBe(
      'unavailable',
    );
  });
});
