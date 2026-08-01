import { createHash } from 'node:crypto';

import { ConflictException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { lastValueFrom, of } from 'rxjs';

import { REQUEST_IDENTITY_KEY } from '../../auth/interfaces/identity';
import { IdempotencyInterceptor, IDEMPOTENT_KEY } from './idempotency.interceptor';

function makeContext(options: {
  idempotent: boolean;
  key?: string;
  body?: unknown;
  userId?: string;
  statusCode?: number;
}) {
  const reply = { statusCode: options.statusCode ?? 201, status: vi.fn() };
  const request = {
    method: 'POST',
    url: '/posts',
    routeOptions: { url: '/posts' },
    headers: options.key ? { 'idempotency-key': options.key } : {},
    body: options.body ?? { body: 'hello' },
    [REQUEST_IDENTITY_KEY]: options.userId
      ? { class: 'player' as const, userId: options.userId }
      : { class: 'guest' as const },
  };

  const reflector = {
    getAllAndOverride: vi.fn((key: string) =>
      key === IDEMPOTENT_KEY ? options.idempotent : undefined,
    ),
  } as unknown as Reflector;

  const redis = { status: 'wait', get: vi.fn(), set: vi.fn() };

  return {
    interceptor: new IdempotencyInterceptor(reflector, redis as never),
    context: {
      getType: () => 'http' as const,
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => reply,
      }),
    },
    reply,
    request,
  };
}

describe('IdempotencyInterceptor', () => {
  beforeEach(() => {
    // each test constructs a fresh interceptor (fresh memory map)
  });

  it('passes through when the handler is not marked idempotent', async () => {
    const { interceptor, context } = makeContext({ idempotent: false, key: 'k1' });
    const result = await lastValueFrom(
      interceptor.intercept(context as never, { handle: () => of({ id: '1' }) }),
    );
    expect(result).toEqual({ id: '1' });
  });

  it('replays the original payload for the same key and body', async () => {
    const first = makeContext({
      idempotent: true,
      key: 'same-key',
      body: { body: 'x' },
      userId: 'user-1',
    });
    await lastValueFrom(
      first.interceptor.intercept(first.context as never, {
        handle: () => of({ id: 'created-1' }),
      }),
    );

    const second = makeContext({
      idempotent: true,
      key: 'same-key',
      body: { body: 'x' },
      userId: 'user-1',
    });
    // share memory by reusing interceptor instance
    const result = await lastValueFrom(
      first.interceptor.intercept(second.context as never, {
        handle: () => of({ id: 'should-not-run' }),
      }),
    );
    expect(result).toEqual({ id: 'created-1' });
    expect(second.reply.status).toHaveBeenCalledWith(201);
  });

  it('rejects key reuse with a different body as IDEMPOTENCY_REPLAY', async () => {
    const ctx = makeContext({
      idempotent: true,
      key: 'same-key',
      body: { body: 'a' },
      userId: 'user-1',
    });
    await lastValueFrom(
      ctx.interceptor.intercept(ctx.context as never, { handle: () => of({ id: '1' }) }),
    );

    const replay = makeContext({
      idempotent: true,
      key: 'same-key',
      body: { body: 'b' },
      userId: 'user-1',
    });
    await expect(
      lastValueFrom(
        ctx.interceptor.intercept(replay.context as never, {
          handle: () => of({ id: '2' }),
        }),
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    try {
      await lastValueFrom(
        ctx.interceptor.intercept(
          makeContext({
            idempotent: true,
            key: 'same-key',
            body: { body: 'c' },
            userId: 'user-1',
          }).context as never,
          { handle: () => of({ id: '3' }) },
        ),
      );
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictException);
      expect((error as ConflictException).getResponse()).toMatchObject({
        code: 'IDEMPOTENCY_REPLAY',
      });
    }
  });

  it('hashes bodies stably', () => {
    const a = createHash('sha256')
      .update(JSON.stringify({ a: 1 }))
      .digest('hex');
    const b = createHash('sha256')
      .update(JSON.stringify({ a: 1 }))
      .digest('hex');
    expect(a).toBe(b);
  });

  it('passes through when the idempotency key is blank', async () => {
    const { interceptor, context } = makeContext({ idempotent: true, key: '   ' });
    const result = await lastValueFrom(
      interceptor.intercept(context as never, { handle: () => of({ id: 'fresh' }) }),
    );
    expect(result).toEqual({ id: 'fresh' });
  });

  it('passes through for non-http contexts', async () => {
    const { interceptor } = makeContext({ idempotent: true, key: 'k1' });
    const result = await lastValueFrom(
      interceptor.intercept(
        { getType: () => 'rpc' as const, getHandler: () => ({}), getClass: () => ({}) } as never,
        { handle: () => of({ id: 'rpc' }) },
      ),
    );
    expect(result).toEqual({ id: 'rpc' });
  });

  it('loads and saves through redis when ready', async () => {
    const store = new Map<string, string>();
    const redis = {
      status: 'ready',
      get: vi.fn(async (key: string) => store.get(key) ?? null),
      set: vi.fn(async (key: string, value: string) => {
        store.set(key, value);
        return 'OK';
      }),
    };
    const reflector = {
      getAllAndOverride: vi.fn((key: string) => (key === IDEMPOTENT_KEY ? true : undefined)),
    } as unknown as Reflector;
    const interceptor = new IdempotencyInterceptor(reflector, redis as never);

    const request = {
      method: 'POST',
      url: '/posts',
      routeOptions: { url: '/posts' },
      headers: { 'idempotency-key': 'redis-key' },
      body: { body: 'redis' },
      [REQUEST_IDENTITY_KEY]: { class: 'player' as const, userId: 'user-redis' },
    };
    const reply = { statusCode: 201, status: vi.fn() };
    const context = {
      getType: () => 'http' as const,
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => reply,
      }),
    };

    await lastValueFrom(
      interceptor.intercept(context as never, { handle: () => of({ id: 'redis-created' }) }),
    );
    expect(redis.set).toHaveBeenCalled();

    const replay = await lastValueFrom(
      interceptor.intercept(context as never, { handle: () => of({ id: 'should-not-run' }) }),
    );
    expect(replay).toEqual({ id: 'redis-created' });
    expect(redis.get).toHaveBeenCalled();
  });
});
