import type { OpenAPIObject } from '@nestjs/swagger';
import { describe, expect, it } from 'vitest';

import { enrichStandardResponses } from './setup-swagger';

describe('OpenAPI standard response enrichment', () => {
  it('adds canonical S1 error responses to every operation', () => {
    const document = {
      openapi: '3.0.0',
      info: { title: 't', version: '1' },
      paths: {
        '/api/v1/posts': {
          post: { responses: { '201': { description: 'created' } } },
        },
        '/api/v1/health/live': {
          get: { responses: { '200': { description: 'ok' } } },
        },
      },
    } as OpenAPIObject;

    enrichStandardResponses(document);

    expect(document.paths['/api/v1/posts']?.post?.responses).toMatchObject({
      '201': { description: 'created' },
      '400': expect.any(Object),
      '401': expect.any(Object),
      '429': expect.any(Object),
      '500': expect.any(Object),
    });
    expect(document.paths['/api/v1/health/live']?.get?.responses?.['429']).toBeDefined();
  });
});
