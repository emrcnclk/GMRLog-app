import { HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { lastValueFrom, of } from 'rxjs';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { REQUEST_IDENTITY_KEY } from '../../auth/interfaces/identity';
import { parseBackendEnv } from '../config/env.schema';
import { AppLogger } from '../logging/app-logger.service';
import { RateLimitInterceptor } from './rate-limit.interceptor';

function createContext(request: Record<string, unknown>) {
  const reply = {
    header: vi.fn(),
  };
  return {
    getType: () => 'http',
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => reply,
    }),
    reply,
  };
}

describe('RateLimitInterceptor', () => {
  let redis: {
    status: string;
    pipeline: ReturnType<typeof vi.fn>;
    zrem: ReturnType<typeof vi.fn>;
  };
  let interceptor: RateLimitInterceptor;

  beforeEach(() => {
    process.env.GMRLOG_RATE_LIMIT_IN_TESTS = '1';
    redis = {
      status: 'ready',
      pipeline: vi.fn().mockReturnValue({
        zremrangebyscore: vi.fn().mockReturnThis(),
        zadd: vi.fn().mockReturnThis(),
        zcard: vi.fn().mockReturnThis(),
        pexpire: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([
          [null, 0],
          [null, 1],
          [null, 1],
          [null, 1],
        ]),
      }),
      zrem: vi.fn(),
    };
    interceptor = new RateLimitInterceptor(
      new Reflector(),
      redis as never,
      new AppLogger(parseBackendEnv({ LOG_LEVEL: 'silent' })),
    );
  });

  afterAll(() => {
    delete process.env.GMRLOG_RATE_LIMIT_IN_TESTS;
  });

  it('skips health and metrics routes', async () => {
    const result = await lastValueFrom(
      interceptor.intercept(
        createContext({ routeOptions: { url: '/health/live' }, url: '/health/live' }) as never,
        { handle: () => of('ok') },
      ),
    );
    expect(result).toBe('ok');
  });

  it('applies class policies and sets rate limit headers', async () => {
    const result = await lastValueFrom(
      interceptor.intercept(
        createContext({
          routeOptions: { url: '/search' },
          url: '/search?q=test',
          method: 'GET',
          headers: {},
          ip: '127.0.0.1',
        }) as never,
        { handle: () => of('ok') },
      ),
    );
    expect(result).toBe('ok');
    expect(redis.pipeline).toHaveBeenCalledOnce();
  });

  it('throws 429 when the window is exhausted', async () => {
    redis.pipeline.mockReturnValue({
      zremrangebyscore: vi.fn().mockReturnThis(),
      zadd: vi.fn().mockReturnThis(),
      zcard: vi.fn().mockReturnThis(),
      pexpire: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([
        [null, 0],
        [null, 1],
        [null, 999],
        [null, 1],
      ]),
    });
    redis.zrem = vi.fn();

    await expect(
      lastValueFrom(
        interceptor.intercept(
          createContext({
            routeOptions: { url: '/posts' },
            url: '/posts',
            method: 'POST',
            headers: {},
            ip: '127.0.0.1',
            [REQUEST_IDENTITY_KEY]: { class: 'player', userId: 'user-1' },
          }) as never,
          { handle: () => of('ok') },
        ),
      ),
    ).rejects.toBeInstanceOf(HttpException);
  });

  it('fails closed for auth when redis is unavailable', async () => {
    redis.pipeline.mockReturnValue({
      zremrangebyscore: vi.fn().mockReturnThis(),
      zadd: vi.fn().mockReturnThis(),
      zcard: vi.fn().mockReturnThis(),
      pexpire: vi.fn().mockReturnThis(),
      exec: vi.fn().mockRejectedValue(new Error('redis down')),
    });

    await expect(
      lastValueFrom(
        interceptor.intercept(
          createContext({
            routeOptions: { url: '/sessions' },
            url: '/sessions',
            method: 'POST',
            headers: {},
            ip: '127.0.0.1',
          }) as never,
          { handle: () => of('ok') },
        ),
      ),
    ).rejects.toMatchObject({ status: HttpStatus.SERVICE_UNAVAILABLE });
  });
});
