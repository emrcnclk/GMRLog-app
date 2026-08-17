import { HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as Sentry from '@sentry/node';
import { lastValueFrom, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { parseBackendEnv } from '../config/env.schema';
import { AppLogger } from '../logging/app-logger.service';
import { ZodValidationException } from './zod-validation.pipe';
import { AppExceptionFilter } from './app-exception.filter';

vi.mock('@sentry/node', () => ({ captureException: vi.fn() }));

describe('AppExceptionFilter', () => {
  const logger = new AppLogger(parseBackendEnv({ LOG_LEVEL: 'silent' }));
  const filter = new AppExceptionFilter(logger);

  beforeEach(() => {
    vi.mocked(Sentry.captureException).mockClear();
  });

  function createHost(request: { id?: string; method?: string; url?: string }) {
    const reply = {
      status: vi.fn().mockReturnThis(),
      header: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };
    return {
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => ({ id: 'req-1', method: 'GET', url: '/test', ...request }),
        getResponse: () => reply,
      }),
      reply,
    };
  }

  it('maps zod validation failures to S1 error envelopes', () => {
    const host = createHost({});
    filter.catch(
      new ZodValidationException({ issues: [{ path: ['email'], message: 'Invalid' }] } as never),
      host as never,
    );
    expect(host.reply.status).toHaveBeenCalledWith(400);
    expect(host.reply.send).toHaveBeenCalledWith({
      error: expect.objectContaining({ code: 'VALIDATION_FAILED', category: 'validation' }),
    });
  });

  it('sets Retry-After on rate limit responses', () => {
    const host = createHost({});
    filter.catch(
      new HttpException(
        { message: 'Rate limit exceeded', code: 'RATE_LIMITED', retryAfter: 12 },
        HttpStatus.TOO_MANY_REQUESTS,
      ),
      host as never,
    );
    expect(host.reply.header).toHaveBeenCalledWith('retry-after', '12');
  });

  it('masks 5xx messages and rethrows non-http hosts', () => {
    const host = createHost({});
    filter.catch(new HttpException('db exploded', HttpStatus.INTERNAL_SERVER_ERROR), host as never);
    expect(host.reply.send).toHaveBeenCalledWith({
      error: expect.objectContaining({ message: 'Unexpected error' }),
    });

    expect(() => filter.catch(new Error('boom'), { getType: () => 'rpc' } as never)).toThrow(
      'boom',
    );
  });

  it('reports 5xx failures to Sentry, tagged with the request id', () => {
    const host = createHost({ id: 'req-500' });
    filter.catch(new HttpException('db exploded', HttpStatus.INTERNAL_SERVER_ERROR), host as never);

    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.any(HttpException),
      expect.objectContaining({ tags: expect.objectContaining({ requestId: 'req-500' }) }),
    );
  });

  it('does not report 4xx refusals to Sentry — rate limits and validation are expected, not incidents', () => {
    const host = createHost({});
    filter.catch(
      new HttpException(
        { message: 'Rate limit exceeded', code: 'RATE_LIMITED', retryAfter: 12 },
        HttpStatus.TOO_MANY_REQUESTS,
      ),
      host as never,
    );
    filter.catch(
      new ZodValidationException({ issues: [{ path: ['email'], message: 'Invalid' }] } as never),
      host as never,
    );

    expect(Sentry.captureException).not.toHaveBeenCalled();
  });
});
