import { describe, expect, it } from 'vitest';

import { createAppQueryClient } from '../query/query-client';

describe('query persistence defaults', () => {
  it('uses offlineFirst networkMode for queries and mutations', () => {
    const client = createAppQueryClient();
    expect(client.getDefaultOptions().queries?.networkMode).toBe('offlineFirst');
    expect(client.getDefaultOptions().mutations?.networkMode).toBe('offlineFirst');
  });
});
