import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  buildApiError,
  defaultCodeForCategory,
  isRetryableCategory,
  statusToCategory,
  zodErrorToFields,
} from './api-error';

describe('api-error helpers', () => {
  it('maps known statuses and collapses unknowns', () => {
    expect(statusToCategory(404)).toBe('not_found');
    expect(statusToCategory(503)).toBe('unavailable');
    expect(statusToCategory(599)).toBe('internal');
    expect(statusToCategory(418)).toBe('validation');
  });

  it('builds error bodies with retryable categories', () => {
    expect(isRetryableCategory('rate')).toBe(true);
    expect(isRetryableCategory('validation')).toBe(false);
    expect(defaultCodeForCategory('authn')).toBe('UNAUTHENTICATED');

    const body = buildApiError({
      status: 429,
      requestId: 'req-1',
      message: 'Slow down',
    });
    expect(body).toMatchObject({
      category: 'rate',
      code: 'RATE_LIMITED',
      retryable: true,
      requestId: 'req-1',
    });

    const withFields = buildApiError({
      status: 400,
      requestId: 'req-2',
      message: 'Bad',
      code: 'CUSTOM',
      fields: [{ path: 'body', code: 'too_small', message: 'short' }],
    });
    expect(withFields.code).toBe('CUSTOM');
    expect(withFields.fields).toHaveLength(1);
  });

  it('maps zod issues to fields', () => {
    const parsed = z.object({ title: z.string().min(2) }).safeParse({ title: 'a' });
    expect(parsed.success).toBe(false);
    if (parsed.success) {
      return;
    }
    const fields = zodErrorToFields(parsed.error);
    expect(fields[0]).toMatchObject({ path: 'title' });
  });
});
