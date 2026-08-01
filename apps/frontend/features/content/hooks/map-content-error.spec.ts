import { FrontendApiError } from '../../../src/api/axios-client';
import { describe, expect, it } from 'vitest';

import { mapContentError } from './map-content-error';

describe('mapContentError', () => {
  it('maps offline', () => {
    const error = mapContentError(new Error('x'), false);
    expect(error.kind).toBe('offline');
  });

  it('maps 409 conflict for duplicate create', () => {
    const error = mapContentError(
      new FrontendApiError('Already reviewed', 409, null, 'req_1'),
      true,
    );
    expect(error.title).toBe('Already exists');
    expect(error.description).toContain('Already reviewed');
  });

  it('maps validation envelope', () => {
    const error = mapContentError(
      new FrontendApiError(
        'Invalid',
        400,
        {
          error: {
            code: 'VALIDATION_FAILED',
            category: 'validation',
            message: 'Invalid',
            requestId: 'req_1',
            retryable: false,
          },
        },
        'req_1',
      ),
      true,
    );
    expect(error.kind).toBe('validation');
  });
});
